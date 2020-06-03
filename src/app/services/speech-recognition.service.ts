import { Injectable } from '@angular/core';
import { UserPreferencesService } from './user-preferences.service';
import { SearchPolicyholderFilter } from '../interfaces/search-policyholder-filter';
import { Observable, of, Subject } from 'rxjs';

export enum SpeechRecognitionContext {
    PersonSearch
}

export class SpeechRecognitionGrammarContext {
    constructor(
        public context: SpeechRecognitionContext,
        public language: string,
        public recognizedWords: string[],
        public initialCommand: string) {}
}

export class FailedRecognition {
    constructor(public isError: boolean) {}
}

export interface IWindow extends Window {
    webkitSpeechRecognition: any;
    webkitSpeechGrammarList: any;
  }

@Injectable()
export class SpeechRecognitionService {
    private speechRecognition: SpeechRecognition;
    private speechGrammarList: SpeechGrammarList;
    private speechRecognitionGrammarPerContext: { [language: string]: SpeechRecognitionGrammarContext[]} = {};
    private speechType = typeof SpeechRecognition;

    public recognizedCommand = new Subject<any>();
    public failedToRecognizeCommand = new Subject<FailedRecognition>();

    public get IsSpeechRecognitionAvailable(): boolean {
        return !!this.speechRecognition;
    }

    constructor(private userPreferenceService: UserPreferencesService) {
        const usePrefixes = this.speechType === 'undefined';
        const {webkitSpeechRecognition} = (window as any);
        const {webkitSpeechGrammarList} = (window as any);

        this.speechRecognition = usePrefixes ? new webkitSpeechRecognition() : new SpeechRecognition();
        this.speechGrammarList =  usePrefixes ? new webkitSpeechGrammarList() : new SpeechGrammarList();

        // tslint:disable-next-line: no-string-literal
        this.speechRecognitionGrammarPerContext['fr'] = [new SpeechRecognitionGrammarContext(
            SpeechRecognitionContext.PersonSearch,
            'fr',
            ['recherche', 'par'],
            'recherche par')];

        // tslint:disable-next-line:no-string-literal
        this.speechRecognitionGrammarPerContext['en'] = [new SpeechRecognitionGrammarContext(
                SpeechRecognitionContext.PersonSearch,
                'en',
                ['search', 'by'],
                'search by')];
    }

    public listenToContractSearchVoiceRecogniton(context: SpeechRecognitionContext): void {
        this.speechGrammarList.addFromString(this.getRecognizedGrammar(context));
        this.speechRecognition.grammars = this.speechGrammarList;
        this.speechRecognition.continuous = false;
        this.speechRecognition.lang = this.userPreferenceService.selectedLanguage;
        this.speechRecognition.interimResults = false;
        this.speechRecognition.maxAlternatives = 1;

        this.speechRecognition.start();

        this.speechRecognition.onresult = event => {
            const voiceCommand = event.results[0][0].transcript;
            const recognitionGrammarPerContext  = this.getSpeechRecognitionGrammarContext(context);

            if (voiceCommand.startsWith(recognitionGrammarPerContext.initialCommand)) {
                const policyholderValue =
                    this.convertNumberSentenceToNumber(
                        voiceCommand.replace(recognitionGrammarPerContext.initialCommand, '')
                        .replace(/ /g, '')
                    );

                if (!isNaN(policyholderValue)) {
                    const policyHolderFilter: SearchPolicyholderFilter = {
                        policyholderId: policyholderValue,
                    };

                    this.recognizedCommand.next(policyHolderFilter);
                    return;
                }
            }

            this.failedToRecognizeCommand.next(new FailedRecognition(false));
        };

        this.speechRecognition.onspeechend = () => {
            this.speechRecognition.stop();
        };

        this.speechRecognition.onnomatch = event => {
            this.failedToRecognizeCommand.next(new FailedRecognition(false));
        };

        this.speechRecognition.onerror = event => {
            this.failedToRecognizeCommand.next(new FailedRecognition(true));
        };
    }

    private getRecognizedGrammar(context: SpeechRecognitionContext): string {
        const recognitionGrammarPerContext  = this.getSpeechRecognitionGrammarContext(context);

        return '#JSGF V1.0; grammar test; public <test> = ' + recognitionGrammarPerContext.recognizedWords.join(' | ') + ' ;';
    }

    private getSpeechRecognitionGrammarContext(context: SpeechRecognitionContext): SpeechRecognitionGrammarContext {
        const recognitionGrammarPerLanguage = this.speechRecognitionGrammarPerContext[this.userPreferenceService.selectedLanguage];
        return recognitionGrammarPerLanguage.find(c => c.context === context);
    }

    private convertNumberSentenceToNumber(sentence: string): number {
        const numbers: { [language: string]: string[]} = {};
        // tslint:disable-next-line:no-string-literal
        numbers['en'] = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
        // tslint:disable-next-line:no-string-literal
        numbers['fr'] = ['zero', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];

        let numberValue = sentence;

        for (let index = 0; index < numbers[this.userPreferenceService.selectedLanguage].length; index++) {
            const numberAsWord = numbers[this.userPreferenceService.selectedLanguage][index];
            numberValue = numberValue.replace(numberAsWord, index.toString());
        }

        return Number(numberValue);
    }
}


