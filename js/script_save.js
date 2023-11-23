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

    // Bereiten Sie die Daten für das Donut-Diagramm vor
    const preparedData = prepareDonutData(data, 'industry', 'employee_sizes');
    createDonutChart('#donut-plot', preparedData);
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
                   .attr("class", "checkbox-label")
                   .attr("for", industry) // Damit das Label richtig mit der Checkbox verknüpft ist
                   .text(industry);
  
      // Event-Listener für Änderungen hinzufügen, mit der spezifischen Funktion
      checkbox.on("change", updateScatterplotWithIndustryProp);
    });
  }
  

// Funktion zum Vorbereiten der Daten für das Donut-Diagramm
function prepareDonutData(data, industryProp, employeeSizeProp) {
  // Verwenden von d3.rollup, um die Daten zu aggregieren
  const industryCounts = d3.rollup(data, 
                                   v => d3.sum(v, d => +d[employeeSizeProp]), // Summiere das 'employeeSizeProp' für jede Gruppe
                                   d => d[industryProp]); // Gruppierung nach 'industryProp'

  // Konvertieren der Map zurück in ein für d3.pie passendes Array
  const industryArray = Array.from(industryCounts, ([key, value]) => ({ key, value }));

  return industryArray;
}

function createDonutChart(selector, data) {
  // Größe und Marge des Diagramms festlegen
  const width = 800, // Breiter, um Platz für Beschriftungen zu schaffen
        height = 550,
        margin = 100; // Größere Marge für Beschriftungen
  const radius = Math.min(width, height) / 2 - margin;

  // SVG-Element erstellen
  const svg = d3.select(selector)
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", `translate(${width / 2}, ${height / 2})`);

  // Die Farbskala definieren
  const color = d3.scaleOrdinal(d3.schemeCategory10);

  // Daten für das Diagramm vorbereiten
  const pie = d3.pie()
                .value(d => d.value)
                .sort(null); // um sicherzustellen, dass die Reihenfolge der Daten erhalten bleibt
  const dataReady = pie(data);

  // Der Bogen-Generator für das Donut-Diagramm
  const arc = d3.arc()
                .innerRadius(radius * 0.5) // Für den Donut-Effekt
                .outerRadius(radius);

  // Die Segmente des Donut-Diagramms erstellen
  svg.selectAll('allSlices')
     .data(dataReady)
     .enter()
     .append('path')
     .attr('d', arc)
     .attr('fill', d => color(d.data.key))
     .attr("stroke", "white")
     .style("stroke-width", "2px")
     .style("opacity", 0.7);

  // Der Bogen-Generator für die Labels
  const labelArc = d3.arc()
                     .innerRadius(radius * 0.85)
                     .outerRadius(radius * 0.85);

  // Polylinien für die Labels hinzufügen
  svg.selectAll('allPolylines')
     .data(dataReady)
     .enter()
     .append('polyline')
     .attr('points', d => {
         const posA = arc.centroid(d); // Linienanfang auf dem Bogen
         const posB = labelArc.centroid(d); // Linienmitte
         const posC = labelArc.centroid(d); // Linienende
         posC[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1); // Horizontaler Abstand
         return [posA, posB, posC];
     })
     .style('fill', 'none')
     .style('stroke', 'grey')
     .style('stroke-width', '1px');

  // Beschriftungen hinzufügen
  svg.selectAll('allLabels')
     .data(dataReady)
     .enter()
     .append('text')
     .text(d => `${d.data.key}: ${d.data.value}`)
     .attr('transform', d => {
         const pos = labelArc.centroid(d);
         pos[0] = radius * (midAngle(d) < Math.PI ? 1 : -1); // Horizontaler Abstand
         return `translate(${pos})`;
     })
     .style('text-anchor', d => midAngle(d) < Math.PI ? 'start' : 'end')
     .style('font-size', '12px');

  // Hilfsfunktion zur Bestimmung der Seiten (links/rechts) für die Textbeschriftung
  function midAngle(d) {
      return d.startAngle + (d.endAngle - d.startAngle) / 2;
  }
}
