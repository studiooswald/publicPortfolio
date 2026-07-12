---
---

## Werkgruppen

```dataview
TABLE WITHOUT ID
	rows.file.link as "Werke",
	length(rows) as "Anzahl",
	min(rows.Year) + " – " + max(rows.Year) as "Zeitraum"
FROM #BodyOfWork
WHERE Series != "" AND Series != null
GROUP BY Series as "Serie"
SORT rows[0].Year DESC
```

```dataview
TABLE WITHOUT ID
	file.link as "Werk",
	Year as "Jahr",
	Dimensions as "Maße"
FROM #BodyOfWork
WHERE Series = "" OR Series = null
SORT Year DESC
```
> [!info] Werk einer Serie zuordnen
> Trag in der Datei unter `Series:` den Seriennamen ein, z.B. `Series: "an odd series of objects"`. Das Werk erscheint dann automatisch in der entsprechenden Werkgruppe.

## complete Work
```dataview

TABLE embed(link(file.outlinks[0])) as Image,
Year, Sold, Location, Series, Dimensions

FROM #BodyOfWork

SORT year DESC

```
## available Work

```dataview

TABLE embed(link(file.outlinks[0])) as Image,
Year, Sold, Location, Series, Dimensions

FROM #BodyOfWork
WHERE contains(Sold,"No")

SORT year DESC

```
