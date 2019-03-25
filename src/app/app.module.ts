import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { SessionTimeoutComponent } from './session-timeout/session-timeout.component';


@NgModule({
  declarations: [
    AppComponent,
    SessionTimeoutComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
