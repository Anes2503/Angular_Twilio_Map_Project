import { MediaMatcher } from '@angular/cdk/layout';
import { ChangeDetectorRef, Component, OnDestroy, inject, Input, Output, EventEmitter } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatExpansionModule } from '@angular/material/expansion';
import { SmsMessage } from '../simple-map/simple-map.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [CommonModule, MatToolbarModule, MatButtonModule, MatIconModule, MatSidenavModule, MatListModule, MatExpansionModule],
})
export class SidebarComponent implements OnDestroy {
  mobileQuery: MediaQueryList;
  @Input() messages: SmsMessage[] = [];
  @Input() selectedCoordinates: { lat: number; lng: number }[] = [];
  @Output() onSelectMeasurement = new EventEmitter<{ lat: number; lng: number }[]>();
  @Output() onClearMarkers = new EventEmitter<void>();
  @Output() onDeleteMeasurement = new EventEmitter<number>();

  private _mobileQueryListener: () => void;

  constructor() {
    const changeDetectorRef = inject(ChangeDetectorRef);
    const media = inject(MediaMatcher);
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnDestroy(): void {
    this.mobileQuery.removeListener(this._mobileQueryListener);
  }

  parseMeasurements(body: string): { lat: number; lng: number }[] {
    const matches = body.match(/Lat = ([\d.]+), Lng = ([\d.]+)/g);
    return matches?.map(match => {
      const [lat, lng] = match.replace('Lat = ', '').replace('Lng = ', '').split(', ');
      return { lat: parseFloat(lat), lng: parseFloat(lng) };
    }) || [];
  }

  calculateDistance(coordinates: { lat: number; lng: number }[]): number {
    let totalDistance = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      const from = coordinates[i];
      const to = coordinates[i + 1];
      const distance = this.getDistanceFromLatLonInKm(from.lat, from.lng, to.lat, to.lng);
      totalDistance += distance;
    }
    return totalDistance;
  }

  getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon1 - lon2);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d * 1000; // return distance in meters
  }

  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  selectMeasurement(coordinates: { lat: number; lng: number }[]): void {
    this.onSelectMeasurement.emit(coordinates);
  }

  clearMarkers(): void {
    this.onClearMarkers.emit();
  }

  deleteMeasurement(index: number): void {
    this.onDeleteMeasurement.emit(index); // Emit index of message to delete
  }
}
