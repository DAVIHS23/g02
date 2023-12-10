import pandas as pd

# Laden der CSV-Datei
df = pd.read_csv('data/DAVI_data_clean.csv')

# Wörterbuch der Übersetzungen
translations = {
    "Healthcare": "Gesundheitswesen",
    "Industrials": "Industrie",
    "Consumer Cyclical": "Konsumzyklisch",
    "Technology": "Technologie",
    "Consumer Defensive": "Konsumdefensiv",
    "Utilities": "Versorgung",
    "Financial Services": "Finanzdienstleistungen",
    "Basic Materials": "Primärrohstoffe",
    "Real Estate": "Immobilien",
    "Energy": "Energie",
    "Communication Services": "Kommunikationsdienste"
}

# Anwenden der Übersetzungen auf die Spalte 'industry'
df['industry'] = df['industry'].map(translations)

# Speichern der übersetzten Daten in einer neuen CSV-Datei
df.to_csv('data/DAVI_data_clean_de.csv', index=False)

print("Übersetzung abgeschlossen und in 'DAVI_data_clean_de.csv' gespeichert.")
