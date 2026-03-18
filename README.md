# homeBot

En lokal AI-chatt som körs helt på din dator via [Ollama](https://ollama.com) och Llama 3.2. 
Fungerar utmärkt för korta sammanfattning 

## Funktioner

- Chatta med en lokal AI-modell
- Bifoga filer som AI:n kan läsa och analysera (PDF, TXT, DOCX)
- Kopiera AI-svar med ett klick
- Stäng av Ollama och servern direkt från gränssnittet

## Krav

- [Node.js](https://nodejs.org) version **18 eller senare**
- [Ollama](https://ollama.com) version **0.1.0 eller senare** med modellen `llama3.2` installerad

### Installera modellen

```bash
ollama pull llama3.2
```

## Starta

1. Navigera till projektmappen i Utforskaren
2. Dubbelklicka på `homeBot.bat`
3. Ett terminalfönster öppnas och startar Ollama automatiskt
4. När Ollama är redo öppnas appen i webbläsaren på `http://localhost:3000`

### Genväg på skrivbordet (valfritt)

För snabb åtkomst utan att öppna Utforskaren varje gång:

1. Högerklicka på `homeBot.bat` i Utforskaren
2. Välj **Visa fler alternativ** → **Skicka till** → **Skrivbordet (skapa genväg)**
3. Dubbelklicka på genvägen på skrivbordet för att starta appen

## Stäng av

Klicka på **Stäng av**-knappen längst upp till höger i appen. Det stänger av Ollama, Node-servern och webbläsarfliken.

## Filstöd

| Format | Stöd |
|--------|------|
| PDF    | ✓    |
| TXT    | ✓    |
| DOCX   | ✓    |

Dra och släpp en eller flera filer direkt i textfältet.
