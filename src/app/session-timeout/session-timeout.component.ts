import { Component, NgZone, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { empty, merge, of, timer, Subscription } from 'rxjs';
import { delay, expand, map, takeWhile } from 'rxjs/operators';

enum TimerType {
  WARNING,
  EXPIRED
}

interface TimerEvent {
  type: TimerType,
  timeLeft: number;
}

@Component({
  selector: 'app-session-timeout',
  templateUrl: './session-timeout.component.html',
  styleUrls: ['./session-timeout.component.scss']
})
export class SessionTimeoutComponent implements OnInit {
  sessionDuration = 15000;
  warningAmount = 10000;
  warningDuration = this.sessionDuration - this.warningAmount;
  endEpoch: number;
  timerOutput: any[];

  private timeoutSub: Subscription;

  constructor(
    private readonly ngZone: NgZone
  ) {
  }

  ngOnInit(): void {
    this.startTimer();
  }

  refreshSession(): void {
    if (this.timeoutSub) {
      this.timeoutSub.unsubscribe();
    }
    this.startTimer();
  }

  destroySession(): void {
    if (this.timeoutSub) {
      this.timeoutSub.unsubscribe();
    }
  }

  // Reference: https://stackoverflow.com/questions/29971898/how-to-create-an-accurate-timer-in-javascript
  // Reference: https://blog.angularindepth.com/rxjs-understanding-expand-a5f8b41a3602
  private startTimer(): void {
    const nowEpoch: number = Date.now();
    this.endEpoch = nowEpoch + this.sessionDuration;

    const targetDate: Date = new Date(this.endEpoch);
    console.log(`Target: ${targetDate.toISOString()}`);

    const warning$: Observable<TimerEvent> = this.getWarning$();
    const expire$: Observable<TimerEvent> = this.getExpiration$();
    const timeout$: Observable<TimerEvent> = merge(warning$, expire$);
    this.timerOutput = [];

    this.ngZone.runOutsideAngular(() => {
      this.timeoutSub = timeout$.subscribe(
        (timerEvent: TimerEvent) => {
          const dateStr: string = (new Date()).toISOString();
          console.log(dateStr, timerEvent);
          this.ngZone.run(() => {
            this.timerOutput.push({
              date: dateStr,
              ...timerEvent
            });
          });
        },
        (err) => {
        },
        () => {
          console.log('complete');
        }
      );
    });
  }

  private getWarning$(): Observable<TimerEvent> {
    return timer(this.warningDuration)
      .pipe(
        expand(() => {
          const timeLeft: number = this.getTimeLeft();
          return timeLeft > 0 ?
            of(undefined).pipe(delay(this.getDelay(timeLeft))) :
            empty();
        }),
        map(() => this.getTimeLeft()),
        takeWhile(timeLeft => timeLeft > 0),
        map(timeLeft => {
          timeLeft = Math.ceil(timeLeft / 1000);
          return {
            type: TimerType.WARNING,
            timeLeft
          };
        })
      );
  }

  private getExpiration$(): Observable<TimerEvent> {
    return timer(this.sessionDuration).pipe(
      map(() => {
        return {
          type: TimerType.EXPIRED,
          timeLeft: 0
        };
      })
    );
  }

  private getTimeLeft(): number {
    return this.endEpoch - Date.now();
  }

  private getDelay(timeLeft: number): number {
    return timeLeft % 1000; // this is the milliseconds portion of the time difference
  }

  // Unused
  private option2(): void {
    const sessionDuration = 15000;
    const warningAmount = 5000;
    const warningDuration = sessionDuration - warningAmount;
    const warningPeriod = 1000;
    const nowEpoch: number = Date.now();
    const endEpoch: number = nowEpoch + sessionDuration;
    const warn$ = timer(warningDuration, warningPeriod)
      .pipe(
        map(() => endEpoch - Date.now()),
        takeWhile(timeLeft => timeLeft > 0),
        map(s2 => `warn_${s2}`)
      );
    const expire$ = timer(sessionDuration).pipe(map(s1 => `expire_${s1}`));
    const merged$ = merge(warn$, expire$);
    const subscribe = merged$.subscribe(
      (val) => {
        console.log(new Date().toISOString(), val);
      },
      (err) => {
      },
      () => {
        console.log('complete');
      }
    );
  }
}
