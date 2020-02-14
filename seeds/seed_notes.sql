TRUNCATE noteful_notes RESTART IDENTITY CASCADE;

INSERT INTO noteful_notes 
    (title, content, folder_id)
    VALUES
        ('Beep beep', 'Broooooooom', 1),
        ('Jeep beep', '22222222222', 2),
        ('Deep beep', '33333333333', 3),
        ('Meek beep', '44444444444', 4),
        ('Sleep beep', 'sdgfsdfgsdfg', 2),
        ('Steep beep', 'sdfgsdfggj', 2),
        ('Weep beep', 'cvbncvbn', 2),
        ('Reap beep', 'qyrertwre', 1),
        ('Keep beep', 'tioiiuuuum', 4),
        ('Boop boop', 'Oh hello there', 3);