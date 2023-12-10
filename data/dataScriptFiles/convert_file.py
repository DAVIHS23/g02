import pandas as pd

# Laden der CSV-Datei
data = pd.read_csv('data/DAVI_data.csv')

# Konvertierung der 'Full Time Employees'-Spalte von String zu Integer
# Entfernen von nicht-numerischen Zeichen und Umwandlung in Integer
# Nicht-numerische Werte werden durch NaN ersetzt und dann durch 0 ersetzt
data['full_time_employees'] = pd.to_numeric(data['full_time_employees'].str.replace(',', ''), errors='coerce')
data['full_time_employees'] = data['full_time_employees'].fillna(0).astype(int)

# Speichern der konvertierten Daten in einer neuen CSV-Datei
data.to_csv('data/new_DAVI_data.csv', index=False)
