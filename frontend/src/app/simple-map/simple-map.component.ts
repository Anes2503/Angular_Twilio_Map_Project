import { Component, OnInit, Inject, PLATFORM_ID, AfterViewInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { SidebarComponent } from '../sidebar/sidebar.component';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { Feature } from 'ol';
import { Point, LineString, Geometry } from 'ol/geom';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Style, Icon, Stroke } from 'ol/style';
import { fromLonLat } from 'ol/proj';
import { SmsService } from '../service/sms.service';

export interface SmsMessage {
  body: string;
  from: string;
  dateSent: string;
  sid: string;
}

@Component({
  selector: 'app-map',
  templateUrl: './simple-map.component.html',
  styleUrls: ['./simple-map.component.scss'],
  standalone: true,
  imports: [CommonModule, MatSidenavModule, MatListModule, MatExpansionModule, MatButtonModule, SidebarComponent],
})
export class MapComponent implements OnInit, AfterViewInit {
  map!: Map;
  vectorLayer!: VectorLayer<VectorSource<Feature<Geometry>>>;
  lineLayer!: VectorLayer<VectorSource<Feature<Geometry>>>;
  messages: SmsMessage[] = [];
  selectedCoordinates: { lat: number; lng: number }[] = [];

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private smsService: SmsService) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeMap();

      this.smsService.getMessages().subscribe(
        (messages) => {
          this.messages = messages.map((msg: SmsMessage) => ({
            body: msg.body,
            from: msg.from,
            dateSent: msg.dateSent,
            sid: msg.sid,
          }));
        },
        (error) => {
          console.error('Error retrieving messages:', error);
        }
      );
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.map) {
        this.map.updateSize();
      }
    }, 300);
  }

  initializeMap(): void {
    this.map = new Map({
      target: 'map',
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat([16.47, 43.511]),
        zoom: 13,
      }),
    });
  }

  addMarkersAndLines(coordinates: { lat: number; lng: number }[]): void {
    const features = coordinates.map(coord => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([coord.lng, coord.lat])),
      });
      feature.setStyle(
        new Style({
          image: new Icon({
            src: 'https://openlayers.org/en/latest/examples/data/icon.png',
            scale: 0.5,
          }),
        })
      );
      return feature;
    });

    const vectorSource = new VectorSource({
      features,
    });

    // If there's already a vectorLayer, remove it first
    if (this.vectorLayer) {
      this.map.removeLayer(this.vectorLayer);
    }

    this.vectorLayer = new VectorLayer({
      source: vectorSource as any,
    });

    this.map.addLayer(this.vectorLayer);

    // Now, add the line connecting the coordinates
    const lineCoords = coordinates.map(coord => fromLonLat([coord.lng, coord.lat])); // Convert each coordinate to map projection
    const lineFeature = new Feature({
      geometry: new LineString(lineCoords), // Create a LineString geometry
    });

    lineFeature.setStyle(
      new Style({
        stroke: new Stroke({
          color: 'black', // Customize the color of the line
          width: 2, // Customize the width of the line
        }),
      })
    );

    const lineSource = new VectorSource({
      features: [lineFeature],
    });

    if (this.lineLayer) {
      this.map.removeLayer(this.lineLayer); // Remove any existing line layer
    }

    this.lineLayer = new VectorLayer({
      source: lineSource as any,
    });

    this.map.addLayer(this.lineLayer);

    setTimeout(() => {
      const extent = vectorSource.getExtent();
      if (!extent || extent.every((val) => val === Infinity || val === -Infinity)) {
        console.warn('Empty extent, cannot adjust map view.');
        return;
      }

      this.map.getView().fit(extent, {
        padding: [50, 50, 50, 50],
        maxZoom: 18,
        duration: 1000,
      });
    }, 200);
  }

  clearMarkersAndLines(): void {
    if (this.vectorLayer) {
      this.map.removeLayer(this.vectorLayer); // Remove the existing marker layer
      this.vectorLayer = undefined as any; // Clear the reference
    }

    if (this.lineLayer) {
      this.map.removeLayer(this.lineLayer); // Remove the existing line layer
      this.lineLayer = undefined as any; // Clear the reference
    }
  }

  parseMeasurements(body: string): { lat: number; lng: number }[] {
    const matches = body.match(/Lat = ([\d.]+), Lng = ([\d.]+)/g);
    return matches?.map((match) => {
      const [lat, lng] = match.replace('Lat = ', '').replace('Lng = ', '').split(', ');
      return { lat: parseFloat(lat), lng: parseFloat(lng) };
    }) || [];
  }

  selectMeasurement(coordinates: { lat: number; lng: number }[]): void {
    this.clearMarkersAndLines(); // Clear any previous markers and lines
    this.addMarkersAndLines(coordinates); // Add new markers and lines
  }

  deleteMeasurement(index: number): void {
    const sid = this.messages[index].sid;

    this.smsService.deleteMessage(sid).subscribe(
      () => {
        // Remove the message locally
        this.messages.splice(index, 1);
        this.clearMarkersAndLines();
        console.log(`Message with SID ${sid} deleted successfully.`);
      },
      (error) => {
        console.error('Error deleting message:', error);
        alert('An error occurred while deleting the message. Please try again.');
      }
    );
}

}
