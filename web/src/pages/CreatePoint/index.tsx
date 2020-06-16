import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { Link, useHistory } from 'react-router-dom'
import { Map, Marker, TileLayer} from 'react-leaflet'
import { LeafletMouseEvent } from 'leaflet';
import axios from 'axios';

import { FiArrowLeft } from 'react-icons/fi'

import api from '../../services/api'
import './styles.css';
import logo from '../../assets/logo.svg'
import Dropzone from '../../components/Dropzone';

interface Item {
    id: number,
    title: string,
    image_url: string,
}

interface FedState {
    id: number,
    initials: string
}

interface City {
    id: number,
    name: string
}

interface IBGEFedState {
    id: number,
    sigla: string
}

interface IBGECity {
    id: number,
    nome: string
}

const CreatePoint = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [fedStates, setFedStates] = useState<FedState[]>([]);
    const [cities, setCities] = useState<City[]>([]);

    const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0]);

    const [selectedFedState, setSelectedFedState] = useState("0");
    const [selectedCity, setSelectedCity] = useState("0");
    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0]);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [uploadedFile, setUploadedFile] = useState<File>();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: ''
    })

    const history = useHistory();

    //get items from api
    useEffect(() => {
        api.get('items').then(res => {
            setItems(res.data);
        });
    }, []);

    //get fedStates from IBGE
    useEffect(() => {
        axios
        .get<IBGEFedState[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
        .then(res => {
            setFedStates(res.data.map<FedState>(uf => {
                return {
                    id: uf.id,
                    initials: uf.sigla
                }
            }));
        })
    }, []);

    //get cities from IBGE
    useEffect(() => {
        if(selectedFedState === '0') {
            setCities([]);
            return;
        }
        axios
        .get<IBGECity[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedFedState}/municipios`)
        .then(res => {
            setCities(res.data.map<City>(city => {
                return {
                    id: city.id,
                    name: city.nome
                };
            }));
        })
    }, [selectedFedState]);

    //get current position from navigator
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            setInitialPosition([
                position.coords.latitude,
                position.coords.longitude
            ])
        }, error => {
            setInitialPosition([-16.7166549,-49.314579]);
        });
    }, []);

    function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
        const {name, value} = event.target;
        setFormData({...formData, [name]: value});
    }

    function handleFedStateSelection(event: ChangeEvent<HTMLSelectElement>) {
        setSelectedFedState(event.target.value);
    }

    function handleCitySelection(event: ChangeEvent<HTMLSelectElement>) {
        setSelectedCity(event.target.value);
    }

    function handlePositionSelection(event: LeafletMouseEvent) {
        setSelectedPosition([
            event.latlng.lat,
            event.latlng.lng
        ])
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();

        const { name, email, whatsapp } = formData;
        const uf = selectedFedState;
        const city = selectedCity;
        const [latitude, longitude] = selectedPosition;
        const items = selectedItems;

        const data = new FormData();

        data.append('name', name);
        data.append('email', email);
        data.append('whatsapp', whatsapp);
        data.append('uf', uf);
        data.append('city', city);
        data.append('latitude', String(latitude));
        data.append('longitude', String(longitude));
        data.append('items', items.join(', '));

        if(uploadedFile) data.append('image', uploadedFile);

        await api.post('points', data);

        alert('Ponto de Coleta criado!');

        history.push('/');
    }

    function handleItemSelection(id: number){
        const alreadySelected = selectedItems.findIndex(item => item === id);
        if(alreadySelected >= 0){
            const filteredItems = selectedItems.filter(item => item !== id);
            setSelectedItems(filteredItems);
        }
        else {
            setSelectedItems([...selectedItems, id]);
        }
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
                    <div className="field">
                        <label htmlFor="name">Nome da entidade</label>
                        <input
                        type="text"
                        name="name"
                        id="name"
                        onChange={handleInputChange}
                        />
                    </div>
                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">E-mail</label>
                            <input
                            type="email"
                            name="email"
                            id="email"
                            onChange={handleInputChange}
                            />
                        </div>
                        <div className="field">
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

                    <Map center={initialPosition} zoom={15} onClick={handlePositionSelection}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
                        />
                        <Marker position={selectedPosition} />
                    </Map>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="FedState">Estado</label>
                            <select name="FedState" id="FedState" value={selectedFedState} onChange={handleFedStateSelection}>
                                <option value="0">Selecione um estado</option>
                                {fedStates.map(fedState => (
                                    <option value={fedState.initials} key={fedState.id}>{fedState.initials}</option>
                                ))}  
                            </select>
                        </div>
                        <div className="field">
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

                    <ul className="items-grid">
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