import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SmsService {
  private apiUrl = 'http://localhost:3000/api/sms';

  constructor(private http: HttpClient) {}

  getMessages(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  deleteMessage(sid: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${sid}`);
  }
}
