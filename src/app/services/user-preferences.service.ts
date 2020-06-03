import { Injectable } from '@angular/core';

@Injectable()
export class UserPreferencesService {
    private language: string;
    public get selectedLanguage(): string {
        return this.language;
    }
    public set selectedLanguage(language: string) {
        this.language = language;
    }
}
