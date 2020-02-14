CREATE TABLE noteful_folders (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    name TEXT NOT NULL
);

ALTER TABLE noteful_notes
    ADD COLUMN
        folder_id INTEGER REFERENCES noteful_folders(id)
        ON DELETE SET NULL;