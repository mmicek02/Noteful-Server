function makeFoldersArray() {
    return [
        {
            id: 1,
            name: "Biscuits"
        },
        {
            id: 2,
            name: "Gravy"
        },
        {
            id: 3,
            name: "Bangers"
        },
        {
            id: 4,
            name: "Mash"
        }
    ]
}
function makeMaliciousFolders(){
    const maliciousFolders = [
        {
            id: 911,
            name: '<script>alert("xss");</script>'
        },
        {
            id: 912,
            name: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`
        }
    ];

    const expectedFolders = [
        {
            id: 911,
            name: '&lt;script&gt;alert(\"xss\");&lt;/script&gt;'
        },
        {
            id: 912,
            name: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
        }
    ];
    
    return {
        maliciousFolders,
        expectedFolders
    }
}

module.exports = {
    makeFoldersArray,
    makeMaliciousFolders
};