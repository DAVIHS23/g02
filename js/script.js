// Pfad zur CSV-Datei
const csvFilePath = 'data/data.csv';

// Laden der CSV-Datei und dann Ausführung des angegebenen Codes
d3.csv(csvFilePath).then(data => {
    // Datenkonvertierung und Sortierung (wie zuvor geschrieben)

    // Nach der Datenkonvertierung, erstelle die Ranglisten
    createRanking('#esg-table', data.sort((a, b) => b.esg_score - a.esg_score), 'esg_score');
    createRanking('#value-table', data.sort((a, b) => b.value - a.value), 'value');

    // Checkboxen hinzufügen
    addIndustryCheckboxes(data, 'industry');

    // Nun erstelle das Streudiagramm, mit Übergabe des entsprechenden Eigenschaftsnamens für die Industrie
    createScatterplot('#scatterplot', data, 'esg_score', 'value', 'industry');  // Ersetze 'industry' mit deinem tatsächlichen Eigenschaftsnamen für die Industrie, falls er anders ist
});

// Funktion zur Erstellung der Rangliste in einem HTML-Element
function createRanking(selector, data, columnName) {
    // Zuerst das vorhandene Element leeren, um Duplikate zu vermeiden
    d3.select(selector).html('');

    // Erstellen der Tabelle
    const table = d3.select(selector).append('table');
    const headers = ['company', columnName, 'industry']; 
    table.append('thead').append('tr').selectAll('th')
        .data(headers)
        .enter().append('th')
        .text(d => d.charAt(0).toUpperCase() + d.slice(1).replace('_', ' '));  // Formatierung des Headers, um ihn leserlich zu machen

    const rows = table.append('tbody').selectAll('tr')
        .data(data)
        .enter().append('tr');

    // Stellt sicher, dass die Daten korrekt den Zellen zugeordnet werden
    rows.selectAll('td')
        .data(row => [row.company, row[columnName], row.industry])  
        .enter().append('td')
        .text(d => typeof d === 'number' ? d.toLocaleString() : d);  // Zahlen werden für eine schönere Darstellung formatiert
}

// Funktion zur Erstellung eines Streudiagramms
function createScatterplot(selector, data, xProp, yProp, industryProp) {
    // Festlegen der Dimensionen und Abstände des Diagramms
    const margin = { top: 20, right: 150, bottom: 70, left: 80 },
          width = 920 - margin.left - margin.right,
          height = 600 - margin.top - margin.bottom;

    // Auswahl des SVG-Containers und Festlegen seiner Dimensionen
    svg = d3.select(selector)
                  .append("svg")
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)
                  .append("g")
                  .attr("transform", `translate(${margin.left},${margin.top})`);

    // Erstellen einer Farbskala für verschiedene Industrien
    const color = d3.scaleOrdinal(d3.schemeCategory10)
                    .domain(data.map(d => d[industryProp]));

    // X-Achsen-Skala definieren
    const x = d3.scaleLinear()
                .domain(d3.extent(data, d => d[xProp]))
                .range([0, width]);

    // X-Achse im SVG zeichnen
    svg.append("g")
       .attr("transform", `translate(0,${height})`)
       .call(d3.axisBottom(x));

    // Beschriftung der X-Achse hinzufügen
    svg.append("text")
       .attr("text-anchor", "end")
       .attr("x", width / 2 + margin.left)
       .attr("y", height + margin.bottom / 2 )
       .text(xProp.charAt(0).toUpperCase() + xProp.slice(1).replace('_', ' '));

    // Y-Achsen-Skala definieren
    const y = d3.scaleLinear()
                .domain(d3.extent(data, d => d[yProp]))
                .range([height, 0]);

    // Y-Achse im SVG zeichnen
    svg.append("g")
       .call(d3.axisLeft(y));

    // Beschriftung der Y-Achse hinzufügen
    svg.append("text")
       .attr("text-anchor", "end")
       .attr("transform", "rotate(-90)")
       .attr("y", -margin.left + 20)
       .attr("x", -height / 2)
       .text(yProp.charAt(0).toUpperCase() + yProp.slice(1).replace('_', ' '));

    // Punkte (Datenpunkte) zum Streudiagramm hinzufügen
    svg.append('g')
       .selectAll("dot")
       .data(data)
       .enter()
       .append("circle")
       .attr("cx", d => x(d[xProp]))
       .attr("cy", d => y(d[yProp]))
       .attr("r", 5)
       .style("fill", d => color(d[industryProp]));

    // Legende für die Farbkodierung erstellen
    const legend = svg.append("g")
                      .attr("transform", `translate(${width + margin.right / 4}, 20)`);

    // Legendenpunkte hinzufügen
    const legendItem = legend.selectAll(".legend-item")
                             .data(color.domain())
                             .enter().append("g")
                             .attr("class", "legend-item")
                             .attr("transform", (d, i) => `translate(0, ${i * 20})`);

    // Legendenfarbkästchen zeichnen
    legendItem.append("rect")
              .attr("x", 0)
              .attr("width", 18)
              .attr("height", 18)
              .style("fill", color);

    // Textbeschriftungen zur Legende hinzufügen
    legendItem.append("text")
              .attr("x", 22)
              .attr("y", 9)
              .attr("dy", "0.35em")
              .text(d => d);
}

// Höhere Ordnungsfunktion, die den Event-Handler für die Checkboxen generiert
function createUpdateScatterplot(industryProp) {
    // Diese zurückgegebene Funktion wird als Event-Handler für die Checkboxen verwendet
    return function updateScatterplot() {
      // Überprüfen, welche Checkboxen aktiviert sind
      const checkedIndustries = d3.selectAll('.industry-checkbox:checked').nodes()
                                     .map(node => node.value);
  
      // Datenpunkte ein-/ausblenden basierend auf der Auswahl
      svg.selectAll("circle")
           .style("display", d => checkedIndustries.includes(d[industryProp]) ? null : "none");
    };
  }


// Funktion zum Hinzufügen der Checkboxen
function addIndustryCheckboxes(data, industryProp) {
    // Eindeutige Branchen extrahieren
    const industries = [...new Set(data.map(d => d[industryProp]))];
  
    // Container für Checkboxen
    const checkboxContainer = d3.select("#checkbox-container");
  
    // Event-Handler-Funktion generieren, die Zugriff auf das richtige 'industryProp' hat
    const updateScatterplotWithIndustryProp = createUpdateScatterplot(industryProp);
  
    // Checkboxen erstellen
    industries.forEach(industry => {
      // Gruppe für jede Checkbox und ihr Label
      const checkboxGroup = checkboxContainer.append("div")
                             .attr("class", "checkbox-group");
  
      const checkbox = checkboxGroup.append("input")
                              .attr("type", "checkbox")
                              .attr("class", "industry-checkbox")
                              .attr("value", industry)
                              .attr("checked", true); // Standardmäßig alle aktiviert
  
      checkboxGroup.append("label")
                   .attr("for", industry) // Damit das Label richtig mit der Checkbox verknüpft ist
                   .text(industry);
  
      // Event-Listener für Änderungen hinzufügen, mit der spezifischen Funktion
      checkbox.on("change", updateScatterplotWithIndustryProp);
    });
  }
  


