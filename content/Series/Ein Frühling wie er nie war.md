---
SeriesName: Ein Frühling wie er nie war
StartYear: 2025
Status: ongoing
Instagram: No
Instagram-Text: 
---

## Über die Serie

*Beschreibung der Serie hier einfügen*

## Werke in dieser Serie

```dataview
TABLE WITHOUT ID
	file.link as "Werk",
	Year,
	Dimensions,
	Sold,
	Location
FROM #BodyOfWork
WHERE Series = "Ein Frühling wie er nie war"
SORT Year DESC
```

## Gezeigt in

```dataview
LIST
FROM "Exhibitions"
WHERE contains(file.outlinks, this.file.link)
```
