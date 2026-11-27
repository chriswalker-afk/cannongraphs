# Custom Level Library (PR40)

Open **Custom Levels** from the home page, or from the Level Workshop. The library holds up to 100 entries in the current browser. Search by title, world or graph family, and filter by confirmed, draft/tested or imported. Cards preview the actual grid geometry without solution equations. Select a card to view its instructions, graph families, local confirmation status and mode records.

- New creates a separate autosaved draft; Upload accepts one or multiple supported .cannon.json files and creates separate entries. A failed import never overwrites a design.
- Edit opens the selected level in the existing drag-and-drop workshop. Duplicate creates a new draft with fresh identity, confirmation and records. Delete requires explicit confirmation.
- Play is available for any structurally valid design, including an imported unconfirmed challenge. Select Cadet, Pilot or Ace; the actual mode policy, hints, preview and creature budget apply. A completed normal play records best attempt count and banked gems for that exact level revision and mode. Normal play does not count as a designer verification.
- Playtest remains in the workshop. Successful unlimited-practice completion followed by explicit Confirm unlocks Download. Every edit, including metadata, invalidates that entry's test, confirmation and play records. A revision counter prevents stale results from being applied even if the designer restores the former geometry. Other entries are unchanged.
- Download preserves the PR39 portable format: geometry and metadata only. Confirmation, records and answers do not travel with exported files. Imported levels can be played before local confirmation.
- Existing PR39 workshop data migrates into the library with its exact-match test/confirmation status. The old storage key is retained as a backup. Storage is browser-local and may fail due to quota or privacy settings; the UI then explicitly says session only. Back up confirmed levels with downloads. This is not a secure server-side certification system or an online listing.

The regular 72-level catalogue, campaign progression and cosmetic achievements remain isolated. The tests verify migration, independent identity, invalid imports, copy/delete, all three modes, proof isolation, stale revisions, and responsive browser flows.

Next proposed improvement: teacher-oriented level packs, with bulk download/import, a named challenge sequence and a simple local completion summary for classroom use. Public sharing, authentication and server storage are not included.
