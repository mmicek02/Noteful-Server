function makeNotesArray(){
    return [
        {
            id: 1,
            title: "Note One",
            content: "Content One",
            date_modified: "2019-11-20T17:48:56.253Z",
            folder_id: 1
        },
        {
            id: 2,
            title: "Note Two",
            content: "Content Two",
            date_modified: "2019-11-20T17:48:56.253Z",
            folder_id: 2
        },
        {
            id: 3,
            title: "Note Three",
            content: "Content Three",
            date_modified: "2019-11-20T17:48:56.253Z",
            folder_id: 3
        },
    ]
}
function makeMaliciousNote(){
    const maliciousNote = {
        id: 911,
        title: '<script>alert("xss");</script>',
        content: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        date_modified: "2019-11-20T17:48:56.253Z",
        folder_id: 1
    }
    const expectedNote = {
        id: 911,
        title: '&lt;script&gt;alert(\"xss\");&lt;/script&gt;',
        content: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
        date_modified: "2019-11-20T17:48:56.253Z",
        folder_id: 1
    }
    return {
        maliciousNote,
        expectedNote
    }
}

module.exports = {
    makeNotesArray,
    makeMaliciousNote
}