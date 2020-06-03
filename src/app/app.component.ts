import { SpeechRecognitionService, SpeechRecognitionContext } from './services/speech-recognition.service';
import { UserPreferencesService } from './services/user-preferences.service';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'web-speech-api-hands-on';


  partners = [];

  public searchForm: FormGroup;
  public currentPolicyHolderId: number | null = null;
  public isListening = false;

  public get showPartners(): boolean {
    return this.partners && this.partners.length > 0;
  }

  constructor(public speechRecognitionService: SpeechRecognitionService,
              public userPreferencesService: UserPreferencesService,
              protected formBuilder: FormBuilder) {
                this.userPreferencesService.selectedLanguage = 'en';
              }

  ngOnInit() {
    const controls = {
      policyholderId: [this.currentPolicyHolderId]
    };

    this.searchForm = this.formBuilder.group(controls);

    this.speechRecognitionService.failedToRecognizeCommand.subscribe(e => {
      console.log(e);
      this.isListening = false;
    });

    this.speechRecognitionService.recognizedCommand.subscribe(e => {
        console.log(e);
        this.isListening = false;

        this.currentPolicyHolderId = e.policyholderId;
        this.searchForm.controls.policyholderId.setValue(this.currentPolicyHolderId);
        this.generateSomePartners(this.currentPolicyHolderId);
    });
  }

  public onLanguageChange(selectedLanguage: string) {
    this.userPreferencesService.selectedLanguage = selectedLanguage;
  }

  public onListen() {
    this.isListening = true;
    this.speechRecognitionService.listenToContractSearchVoiceRecogniton(SpeechRecognitionContext.PersonSearch);
  }

  public onReset() {
    this.searchForm.controls.policyholderId.setValue(null);
    this.partners = [];
  }

  private generateSomePartners(policyholderId: number) {
    const numberOfPartners = Math.floor(Math.random() * 10) + 1;
    this.partners = [];

    for (let index = 0; index < numberOfPartners; index++) {
      this.partners.push(
        { policyholderId, firstName: this.getWord(5), lastName: this.getWord(7)}
      );
    }
  }

  private getWord(length: number) {
    let result           = '';
    const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }
}
