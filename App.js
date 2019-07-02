import React from 'react';
import {StyleSheet, View, Platform, Dimensions, Animated, StatusBar} from 'react-native';
import MapView, {Polyline, Marker, AnimatedRegion} from 'react-native-maps'
import { Card, ListItem, Input, SearchBar, Button, Divider, Icon, Text  } from 'react-native-elements'
import MapViewDirections from 'react-native-maps-directions';
import { Notifications, Location, Permissions, Constants } from 'expo';
import SlidingUpPanel from 'rn-sliding-up-panel';
// import { getDistance, isPointWithinRadius } from 'geolib';
import { geocodeAsync } from 'expo-location';
import Update from 'react-addons-update'

const LATITUDE_DELTA = 0.009;
const LONGITUDE_DELTA = 0.009;
const LATITUDE = -7.321057;
const LONGITUDE = 112.734399;
const { height } = Dimensions.get("window");
const geolib = require('geolib');

export default class App extends React.Component {

  static defaultProps = {
    draggableRange: { top: height - 180, bottom: 60 }
  };
  _draggedValue = new Animated.Value(180);

    constructor(props){
        super(props)
        this.state = {
            listTempat: [],
            dptRadius:false,
            source:[],
            destination:[],
            informasi:{},
            foto: null,
            namaTempat: null,
            keterangantempat: null,
            region: null,
            isLoading: true,
            lat: -7.3365481,
            long: 112.713068,
            concat: null,
            error: null,
            coords:[],
            x: 'false',
            markerPressed : false,
            latitude: LATITUDE,
            longitude: LONGITUDE,
            routeCoordinates: [],
            coordinate: new AnimatedRegion({
                latitude: LATITUDE,
                longitude: LONGITUDE,
                latitudeDelta: 0,
                longitudeDelta: 0
        })
        };
    }


    componentWillMount() {
      if (Platform.OS === 'Android' && !Constants.isDevice) {
        this.setState({
          errorMessage: 'Oops, this will not work on Sketch in an Android emulator. Try it on your device!',
        });
      } else {
        // Location.setApiKey('AIzaSyA9FobRmxO4zNmTJKK_5Au2J0I6M5UqTWU')
        return fetch('https://www.api.ilmusaya.web.id/public/api/listTempat')
        .then((response) => response.json())
        .then((responseJson) => {
          this.setState({listTempat:responseJson}, () => {
          })
          this._getLocationAsync();
        })
        .catch((error) => {
          console.error(error);
        });
      }
    }

    _getLocationAsync = async () => {
      let { status } = await Permissions.askAsync(Permissions.LOCATION);
      if (status !== 'granted') {
        this.setState({
          errorMessage: 'Permission to access location was denied',
        });
      }
      await Location.watchPositionAsync({enabledHighAccuracy: true}, location => {
        this.setState({ 
          coords : {
            latitude : location.coords.latitude,
            longitude :  location.coords.longitude,
            latitudeDelta: 0.009,
            longitudeDelta: 0.009,
          },
          source:[{
            latitude:location.coords.latitude,
            longitude:location.coords.longitude,
          }]
      }, () => {
        // this._getAlamatGmaps()
        // console.log(this.state)
        this.checkRadius()
      });
    });
      
    }

    onPressMarker(item, index){
      let lat = this.state.listTempat[index].latitude_tempat;
      let long = this.state.listTempat[index].longitude_tempat;
      this.setState({ 
        markerPressed : true,
        destination:[{latitude: lat, longitude: long}],
        namaTempat: this.state.listTempat[index].nama_tempat,
        foto: this.state.listTempat[index].foto,
        keterangantempat: this.state.listTempat[index].keterangan_tempat
      }, () => {
        this._panel.show(200)
      })
    }

    checkRadius = () => {
      let cek = null
      this.state.listTempat.map( (item, index) => {
        cek = geolib.isPointWithinRadius(
          { latitude: item.latitude_tempat, longitude: item.longitude_tempat },
          { latitude: Number(this.state.coords.latitude), longitude: Number(this.state.coords.longitude) },
          5000
        )
        this.state.listTempat[index].key_radius = String(cek)
      })
      this.setState({
        dptRadius:true
      })
    }

    
    render() {
    const key = 'AIzaSyCu31iVIKd18ciqdbaxRXtsucgioewxhDY';
    // console.log(this.state)
    const number = Number(this.state.informasi.durasi)
    const durasi = number.toPrecision(3);

      return (
        <View style={styles.wrapper}>
          <View style={styles.container}>
                  
            { this.state.coords.length !== 0 && this.state.dptRadius === true ?
              <MapView style={styles.map} 
                initialRegion={{  
                  latitude:this.state.coords.latitude,
                  longitude:this.state.coords.longitude,
                  latitudeDelta: this.state.coords.latitudeDelta,
                  longitudeDelta: this.state.coords.longitudeDelta 
                }} 
                showsTraffic={true}
                zoomEnabled={true} 
                showsMyLocationButton={true} 
                showsCompass={true} 
                minZoomLevel={7}
                toolbarEnabled={true}
              >

                {this.state.listTempat.map( (item, index) => {
                  if(item.key_radius === "true")
                    return <MapView.Marker
                      coordinate={{latitude: item.latitude_tempat, longitude: item.longitude_tempat}}
                      title={item.nama_tempat}
                      key={item.id_tempat}
                      description={item.key_radius}
                      pinColor='#1976d2'
                      onPress={(e) => this.onPressMarker(item,index)}
                    />
                  if(item.key_radius === "false")
                    return null;
                })}

                {!!this.state.coords.latitude && !!this.state.coords.longitude && 
                  <MapView.Marker
                  coordinate={{
                    "latitude":this.state.coords.latitude,
                    "longitude":this.state.coords.longitude
                  }}
                  title={"Your Location"} pinColor="#DC143C"/>
                }
                <MapViewDirections
                    origin={this.state.source[0]}
                    destination={this.state.destination[0]}
                    apikey={key}
                    strokeWidth={3}
                    strokeColor='blue'
                    optimizeWaypoints={true}
                    onReady={ result => {      
                      this.setState({ informasi:{jarak:result.distance, durasi:result.duration}})
                    }}
                />
            </MapView>

            : <View></View> }
            
            { this.state.markerPressed === true ?
              <SlidingUpPanel
              ref={c => (this._panel = c)}
              draggableRange={this.props.draggableRange}
              animatedValue={this._draggedValue}
              snappingPoints={[100]}
              height={height + 100}
              friction={0.4}
              >
              <View style={styles.panel}>
              <View style={styles.panelHeader} >
                <Text>Slide Up</Text>

              </View>
                <View style={styles.bottomContainer}>
                  <View>
                    <Card title="Keterangan Lengkap" image={{ uri: 'https://www.api.ilmusaya.web.id/storage/foto/'+this.state.foto }} >
                      <Text h3>
                        {this.state.namaTempat}
                      </Text>
                      <Divider/>
                      <Text>Jarak Tempuh {this.state.informasi.jarak} Km</Text>
                      <Text>Durasi Tempuh {durasi} Menit</Text>
                      <Text> {this.state.keterangantempat} </Text>
                    </Card>
                  </View>
                </View>
              </View>
              </SlidingUpPanel>
            :
              <View>
                <Text h1>
                        {this.state.namaTempat}
                </Text>
              </View>
            }
        </View>
      </View>
    );
  }
}


const styles = StyleSheet.create({
    wrapper:{
        flex:1,
        backgroundColor:'black',
        paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight 

    },
    container: {
        flex: 1,
        // paddingTop: 25,
        backgroundColor: '#fff',
        
    },
    map: {
        position: 'absolute',
        top: 1,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex:-1
    },
    actionButtonIcon: {
        fontSize: 20,
        height: 22,
        color: 'white',
      },
      bottomContainer:{
        flex: 1,
        backgroundColor: "#f8f9fa",
        alignItems: "center",
      },
      panel: {
        flex: 1,
        backgroundColor: "white",
        position: "relative"
      },
      panelHeader: {
        height: 5,
        backgroundColor: "#00D8CB",
        justifyContent: "center",
        alignItems: 'center',
        padding: 16,
      },
      textHeader: {
        fontSize: 28,
        color: "#FFF"
      },
});
