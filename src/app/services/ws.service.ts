import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { WebSocketServiceBase } from 'app/services/ws.service.base';

@UntilDestroy()
@Injectable()
export class WebSocketService extends WebSocketServiceBase {
  constructor(
    protected router: Router,
  ) {
    super(router);

    this.connect();
  }

  send(payload: unknown): void {
    if (this.socket.readyState == WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    } else {
      this.pendingMessages.push(payload);
    }
  }
}
