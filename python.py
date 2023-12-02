import pandas as pd

# Pfad zur CSV-Datei
file_path = './data/DAVI_data.csv'

# Einlesen der CSV-Datei
df = pd.read_csv(file_path)

# Definieren der Spalten, die überprüft werden sollen
columns_to_check = [
    "symbol", "market_capitalization", "company_name", "industry",
    "full_time_employees", "description", "esg_score", "environment_score",
    "governance_score", "social_score"
]

# Löschen aller Zeilen, die leere Einträge in den definierten Spalten haben
df.dropna(subset=columns_to_check, inplace=True)

# Speichern der bereinigten Daten in einer neuen Datei
df.to_csv('./data/DAVI_data_clean.csv', index=False)