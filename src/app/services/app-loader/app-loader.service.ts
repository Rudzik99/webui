import { EventEmitter, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { T } from 'app/translate-marker';
import { AppLoaderComponent } from './app-loader.component';

@Injectable()
export class AppLoaderService {
  dialogRef: MatDialogRef<AppLoaderComponent>;

  constructor(private dialog: MatDialog) { }

  open(title: string = T('Please wait')): Observable<boolean> {
    if (this.dialogRef === undefined) {
      this.dialogRef = this.dialog.open(AppLoaderComponent, { disableClose: true });
      this.dialogRef.updateSize('200px', '200px');
      this.dialogRef.componentInstance.title = title;
      return this.dialogRef.afterClosed();
    }
  }

  close(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
      this.dialogRef = undefined;
    }
  }

  // These pass signals from various components to entity form component to start/stop progress spinner
  callStarted = new EventEmitter<string>();
  callDone = new EventEmitter<string>();
}
