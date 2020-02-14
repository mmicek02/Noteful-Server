TRUNCATE noteful_notes, noteful_folders RESTART IDENTITY CASCADE;

INSERT INTO noteful_folders
    (name)
    VALUES
        ('Folder One'),
        ('Folder Two'),
        ('Sample'),
        ('Folder Four');