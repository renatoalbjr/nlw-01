import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, ScrollView, Image, GestureResponderEvent, Alert } from "react-native";
import { Feather as Icon } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Marker, Region } from "react-native-maps";
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgUri } from "react-native-svg";
import * as Location from 'expo-location'

import api from '../../services/api';

interface Item {
  id: number,
  title: string,
  image_url: string
}

interface Point{
  point: {
    id: number,
    name: string,
    image_url: string,
    latitude: number,
    longitude: number
  }
}

interface Params{
  state: string,
  city: string
}

const Points = () => {
  const navigation = useNavigation();
  const routes = useRoute();

  const routeParam = routes.params as Params;
  
  const [initialRegion, setInitialRegion] = useState<Region>();
  const [points, setPoints] = useState<Point[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  useEffect(() => {//setInitialRegion
    (async function (){
      let { status } = (await Location.getPermissionsAsync());

      if(status === "undetermined") status = (await Location.requestPermissionsAsync()).status;

      if(status === "granted"){
        const location = await Location.getCurrentPositionAsync();

        const {latitude, longitude} = location.coords

        setInitialRegion({
          latitude,
          longitude,
          latitudeDelta: 0.014,
          longitudeDelta: 0.014
        });
      }
    })();
  }, []);

  useEffect(() => {//setItems
    (async function (){
      setItems((await api.get('items')).data);
    })();
  }, []);

  useEffect(() => {//setSelectedItems
    setSelectedItems(items.map(item => item.id));
  }, [items]);

  useEffect(() => {//setPoints
    api.get('points', {
      params: {
        city: routeParam.city,
        uf: routeParam.state,
        items: selectedItems
      }
    }).then(res => {
      setPoints(res.data);
    })
  }, [selectedItems])

  function handleNavigateBack(){
    navigation.goBack();
  };

  function handleNavigateToDetail(id: number){
    navigation.navigate('Detail', { pointId: id });
  };

  function handleItemFilterSelection(id: number) {
    if(selectedItems.includes(id)){
      setSelectedItems(selectedItems.filter(item => item !== id));
      return;
    }
    setSelectedItems([...selectedItems, id]);
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      <View style={styles.container}>
        <TouchableOpacity onPress={handleNavigateBack}>
          <Icon name="log-out" color="#34cb79" size={24} />
        </TouchableOpacity>

        <Text style={styles.title}>Bem Vindo.</Text>
        <Text style={styles.description}>Encontre no mapa um ponto de coleta.</Text>

        <View style={styles.mapContainer}>
          <MapView 
            style={styles.map}
            initialRegion={initialRegion}
          >
            {points.map(point => {
              const pointInfo = point.point;
              return (
                <Marker
                  style={styles.mapMarker}
                  coordinate={{
                    latitude: pointInfo.latitude,
                    longitude: pointInfo.longitude
                  }}
                  onPress={() => handleNavigateToDetail(point.point.id)}
                  key={String(pointInfo.id)}
                >
                  <View style={styles.mapMarkerContainer}>
                    <Image style={styles.mapMarkerImage} source={{ uri: pointInfo.image_url }} />
                    <Text style={styles.mapMarkerTitle}>{pointInfo.name}</Text>
                  </View>
                </Marker>
              )
            })}

          </MapView>
        </View>
      </View>

      <View style={styles.itemsContainer}>
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ padding: 20 }}
        >
          {
            items.map(item => (
                <TouchableOpacity 
                  key={String(item.id)} 
                  style={[
                    styles.item,
                    selectedItems.includes(item.id) ? styles.selectedItem : {}
                  ]} 
                  onPress={() => handleItemFilterSelection(item.id)}
                  activeOpacity={0.6}
                >
                  <SvgUri height={42} width={42} uri={item.image_url} />
                  <Text style={styles.itemTitle}>{item.title}</Text>
                </TouchableOpacity>
              )
            )
          }

        </ScrollView>
      </View>
    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 20 ,
  },

  title: {
    fontSize: 20,
    fontFamily: 'Ubuntu_700Bold',
    marginTop: 24,
  },

  description: {
    color: '#6C6C80',
    fontSize: 16,
    marginTop: 4,
    fontFamily: 'Roboto_400Regular',
  },

  mapContainer: {
    flex: 1,
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 16,
  },

  map: {
    width: '100%',
    height: '100%',
  },

  mapMarker: {
    width: 90,
    height: 80, 
  },

  mapMarkerContainer: {
    width: 90,
    height: 70,
    backgroundColor: '#34CB79',
    flexDirection: 'column',
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center'
  },

  mapMarkerImage: {
    width: 90,
    height: 45,
    resizeMode: 'cover',
  },

  mapMarkerTitle: {
    flex: 1,
    fontFamily: 'Roboto_400Regular',
    color: '#FFF',
    fontSize: 13,
    lineHeight: 23,
  },

  itemsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 32,
  },

  item: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#eee',
    height: 120,
    width: 120,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'space-between',

    textAlign: 'center',
  },

  selectedItem: {
    borderColor: '#34CB79',
    borderWidth: 2,
  },

  itemTitle: {
    fontFamily: 'Roboto_400Regular',
    textAlign: 'center',
    fontSize: 13,
  },
});

export default Points;