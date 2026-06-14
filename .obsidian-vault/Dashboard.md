# Dashboard

```dataview
TABLE status, file.mtime as "Last updated" FROM "bugs" WHERE status = "open" SORT file.mtime DESC
```

```dataview
TABLE status FROM "specs" WHERE status != "done"
```

```dataview
TABLE file.mday as "Date" FROM "decisions" SORT file.mday DESC LIMIT 5
```