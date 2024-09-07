import { Component } from '@angular/core';
import { SidebarComponent } from './sidebar/sidebar.component';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { SmsMessage } from './simple-map/simple-map.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [SidebarComponent, RouterModule, MatSidenavModule],
})
export class AppComponent {
  messages: SmsMessage[] = [];
  selectedCoordinates: { lat: number; lng: number }[] = [];

  selectMeasurement(coordinates: { lat: number; lng: number }[]): void {
    this.selectedCoordinates = coordinates;
    console.log('Selected Coordinates:', this.selectedCoordinates);
  }
}
