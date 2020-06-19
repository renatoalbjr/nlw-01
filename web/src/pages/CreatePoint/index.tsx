import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { Map, Marker, TileLayer} from 'react-leaflet';
import { LeafletMouseEvent } from 'leaflet';
import axios from 'axios';

import { FiArrowLeft } from 'react-icons/fi'

import api from '../../services/api'
import './styles.css';
import logo from '../../assets/logo.svg';
import Dropzone from '../../components/Dropzone';

interface Item {
    id: number,
    title: string,
    image_url: string,
}

interface State {
    id: number,
    initials: string
}

interface City {
    id: number,
    name: string
}

interface IBGEState {
    id: number,
    sigla: string
}

interface IBGECity {
    id: number,
    nome: string
}

const CreatePoint = () => {
    const [initialPosition, setInitialPosition] = useState<[number, number]>([-14.2853653, -50.7650227]);
    const [initialMapZoom, setInitialMapZoom] = useState(3);
    const [states, setStates] = useState<State[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [items, setItems] = useState<Item[]>([]);

    const [uploadedFile, setUploadedFile] = useState<File>();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: ''
    });

    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([-14.2853653, -50.7650227]);
    const [selectedState, setSelectedState] = useState("0");
    const [selectedCity, setSelectedCity] = useState("0");

    const [selectedItems, setSelectedItems] = useState<number[]>([]);

    const history = useHistory();
    
    useEffect(() => {//get current position from navigator
        navigator.geolocation.getCurrentPosition(position => {
            setInitialPosition([
                position.coords.latitude,
                position.coords.longitude
            ]);
            setSelectedPosition([
                position.coords.latitude,
                position.coords.longitude
            ]);
            setInitialMapZoom(15);
        });
    }, []);
    
    useEffect(() => {//get states from IBGE
        axios
        .get<IBGEState[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
        .then(res => {
            setStates(res.data.map<State>(state => {
                return {
                    id: state.id,
                    initials: state.sigla
                }
            }));
        });
    }, []);
    
    useEffect(() => {//get cities from IBGE
        if(selectedState === '0') {
            setCities([]);
            return;
        }
        axios
        .get<IBGECity[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedState}/municipios`)
        .then(res => {
            setCities(res.data.map<City>(city => {
                return {
                    id: city.id,
                    name: city.nome
                };
            }));
        });
    }, [selectedState]);
    
    useEffect(() => {//get items from api
        api.get('items').then(res => {
            setItems(res.data);
        });
    }, []);

    function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
        const {name, value} = event.target;
        setFormData({...formData, [name]: value});
    }

    function handlePositionSelection(event: LeafletMouseEvent) {
        setSelectedPosition([
            event.latlng.lat,
            event.latlng.lng
        ]);
    }

    function handleStateSelection(event: ChangeEvent<HTMLSelectElement>) {
        setSelectedState(event.target.value);
    }

    function handleCitySelection(event: ChangeEvent<HTMLSelectElement>) {
        setSelectedCity(event.target.value);
    }

    function handleItemSelection(id: number){
        if(selectedItems.includes(id)){
            setSelectedItems(selectedItems.filter(item => item !== id));
            return;
        }
        setSelectedItems([...selectedItems, id]);
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();

        const { name, email, whatsapp } = formData;
        const [latitude, longitude] = selectedPosition;

        const data = new FormData();

        data.append('name', name);
        data.append('email', email);
        data.append('whatsapp', whatsapp);
        data.append('uf', selectedState);
        data.append('city', selectedCity);
        data.append('latitude', String(latitude));
        data.append('longitude', String(longitude));
        data.append('items', selectedItems.join(', '));

        if(uploadedFile) data.append('image', uploadedFile);

        await api.post('points', data);

        alert('Ponto de Coleta criado!');

        history.push('/');
    }

    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta"/>

                <Link to="/">
                    <FiArrowLeft />
                    Voltar para home
                </Link>
            </header>
            <form onSubmit={handleSubmit}>
                <h1>Cadastro do <br/> ponto de Coleta</h1>

                <Dropzone onFileUploaded={setUploadedFile} />

                <fieldset>{/* Dados */}
                    <legend>
                        <h2>Dados</h2>
                    </legend>
                    
                    <div className="fieldset-content">
                        <div className="field name-field">{/* Nome */}
                            <label htmlFor="name">Nome da entidade</label>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                onChange={handleInputChange}
                            />
                        </div>
                    
                        <div className="field">{/* E-mail */}
                            <label htmlFor="email">E-mail</label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="field">{/* WhatsApp */}
                            <label htmlFor="whatsapp">WhatsApp</label>
                            <input
                                type="text"
                                name="whatsapp"
                                id="whatsapp"
                                onChange={handleInputChange}
                            />
                        </div>                
                    </div>

                </fieldset>

                <fieldset>{/* Endereço */}
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend>

                    <div className="fieldset-content">
                        
                        <Map center={initialPosition} zoom={initialMapZoom} onClick={handlePositionSelection}>
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
                            />
                            <Marker position={selectedPosition} />
                        </Map>
                        
                        <div className="field">{/* Estado */}
                            <label htmlFor="state">Estado</label>
                            <select name="state" id="state" value={selectedState} onChange={handleStateSelection}>
                                <option value="0">Selecione um estado</option>
                                {states.map(state => (
                                    <option value={state.initials} key={state.id}>{state.initials}</option>
                                ))}  
                            </select>
                        </div>

                        <div className="field">{/* Cidade */}
                            <label htmlFor="city">Cidade</label>
                            <select name="city" id="city" value={selectedCity} onChange={handleCitySelection}>
                                <option value="0">Selecione uma cidade</option>
                                {cities.map(city => (
                                    <option value={city.name} key={city.id}>{city.name}</option>
                                ))}
                            </select>
                        </div>  
                    
                    </div>
                </fieldset>

                <fieldset>{/* Itens de coleta */}
                    <legend>
                        <h2>Itens de Coleta</h2>
                        <span>Selecione um ou mais itens de coleta</span>
                    </legend>

                    <ul className="items">
                        {items.map(item => (
                            <li 
                                key={item.id} 
                                className={selectedItems.includes(item.id) ? 'selected' : ''}
                                onClick={() => handleItemSelection(item.id)}
                            >
                                <img src={item.image_url} alt={item.title}/>
                                <span>{item.title}</span>
                            </li>
                        ))}
                    </ul>
                </fieldset>
                <button type="submit">Cadastrar ponto de coleta</button>
            </form>
        </div>
    );
};

export default CreatePoint;