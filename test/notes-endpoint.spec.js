const knex = require('knex');
const app = require('../src/app');
const { makeNotesArray, makeMaliciousNote } = require('./notes.fixture');
const { makeFoldersArray } = require('./folders.fixture')

const path = require('path');

describe(`Notes endpoints`,()=>{
    let db

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.DB_URL,
        })
        app.set('db', db)
    })

    after('disconnect from database', ()=> db.destroy())

    before('clean the table',()=> db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE'))

    afterEach('cleanup',()=> db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE'))

    beforeEach(`insert folders`,()=>{
        const testFolders = makeFoldersArray();
        return db 
            .into('noteful_folders')
            .insert(testFolders)
    })

    describe(`GET /notes`,()=>{
        context(`given there are notes in the folders`,()=>{
            const testNotes = makeNotesArray();
            beforeEach(`insert notes`,()=>{
                return db
                    .into('noteful_notes')
                    .insert(testNotes)
            })
            it(`should respond 200 and get the note list`,()=>{
                return supertest(app)
                    .get(`/notes`)
                    .expect(200, testNotes)
            })
        })
        context(`given no notes in folders/database`,()=>{
            it(`responds 200 and returns an empty array`,()=>{
                return supertest(app)
                    .get(`/notes`)
                    .expect(200, [])
            })
        })
    })
    describe(`GET /notes/:note_id`,()=>{
        context(`given there are no notes in database`,()=>{
            it(`should return 404 and give an error`,()=>{
                return supertest(app)
                    .get(`/notes/1`)
                    .expect(404, {
                        error: {message: `Note doesn't exist.`}
                    })
            })
        })
        context(`given there are notes in the database`,()=>{
            const testNotes = makeNotesArray();
            beforeEach(`insert notes`,()=>{
                return db
                    .into('noteful_notes')
                    .insert(testNotes)
            })
            it(`should respond 200 and return the correct note via its id`,()=>{
                const idToGet = 2;
                const expectedNote = testNotes[idToGet-1];
                return supertest(app)
                    .get(`/notes/${idToGet}`)
                    .expect(200, expectedNote)
            })
        })
        context(`given an XSS attack note`,()=>{
            const { maliciousNote, expectedNote} = makeMaliciousNote();
            beforeEach(`insert xss note`,()=>{
                return db
                    .into('noteful_notes')
                    .insert(maliciousNote)
            })
            it(`should sanitize the note`,()=>{
                return supertest(app)
                    .get(`/notes/${maliciousNote.id}`)
                    .expect(200, expectedNote)
            })
        })
    })
    describe(`POST /notes`,()=>{
        it(`responds 201 and inserts the note`,function(){
            this.retries(3) //in case the milliseconds roll over and change the date
            const newNote = {
                title: "Note One",
                content: "Content One",
                folder_id: 1
            };
            return supertest(app)
                .post(`/notes`)
                .send(newNote)
                .expect(201)
                .expect(res => {
                    expect(res.body.content).to.eql(newNote.content)
                    expect(res.body.title).to.eql(newNote.title)
                    const expected = new Date().toLocaleString()
                    const actual = new Date(res.body.date_modified).toLocaleString()
                    expect(actual).to.eql(expected)
                })
        })

        const requiredFields = ['title', 'content', 'folder_id']
        requiredFields.forEach(field => {
            const newNote = {
                title: "Note One",
                content: "Content One",
                folder_id: 1
            };
    
            it(`responds with 400 and an error message when the '${field}' is missing`, () => {
                delete newNote[field]
        
                return supertest(app)
                    .post('/notes')
                    .send(newNote)
                    .expect(400, {
                        error: { message: `Missing '${field}' in request body.` }
                    })
            })
        })
        it(`removes XSS content from the note`,()=>{
            const {maliciousNote, expectedNote} = makeMaliciousNote();
            return supertest(app)
                .post(`/notes`)
                .send(maliciousNote)
                .expect(201)
                .expect(res => {
                    for(const [key] of Object.entries(expectedNote)){
                        expect(res.body.key).to.eql(expectedNote.key)
                    }
                })
        })
    })
    describe(`DELETE /notes/:note_id`,()=>{
        context(`given no notes in database`,()=>{
            it(`returns 404 and an error msg`,()=>{
                return supertest(app)
                .delete(`/notes/6`)
                .expect(404, {
                    error: {message: `Note doesn't exist.`}
                })                
            })
        })
        context(`given notes in database`,()=>{
            const testNotes = makeNotesArray();
            beforeEach(`insert notes`,()=>{
                return db
                    .into('noteful_notes')
                    .insert(testNotes)
            })
            const idToDelete = 2;
            const expectedArray = testNotes.filter(note => note.id !== idToDelete);
            it(`responds 204, and removes the note`,()=>{
                return supertest(app)
                .delete(`/notes/${idToDelete}`)
                .expect(204)
                .then(res => 
                    supertest(app)
                        .get(`/notes`)
                        .expect(expectedArray)    
                )
            })
        })  
    })
    
    describe(`PATCH /notes`,()=>{
        context(`given no notes in database`,()=>{
            it(`should respond 404 and return an error`,()=>{
                return supertest(app)
                    .patch(`/notes/99`)
                    .expect(404, {
                        error: {message: `Note doesn't exist.`}
                    })
            })
        })
        context(`given there are notes in the database`,()=>{
            const testNotes = makeNotesArray();
            beforeEach(`insert notes`,()=>{
                return db
                    .into('noteful_notes')
                    .insert(testNotes)
            })
            it(`should update the expected fields and return 204`,()=>{  
                
                const idToUpdate = 2;
                const updatedFields = {
                    title: "updated",
                    content: "updated",
                    folder_id: 1,
                };
                const expectedNote = {
                    ...testNotes[idToUpdate-1],
                    ...updatedFields
                }
                return supertest(app)
                    .patch(`/notes/${idToUpdate}`)
                    .send(updatedFields)
                    .expect(204)
                    .then(res => {
                        return supertest(app)
                            .get(`/notes/${idToUpdate}`)
                            .expect(expectedNote)
                    })
            })
            it(`reponds 400 when no required fields are supplied`,()=>{
                const idToUpdate = 2;
                return supertest(app)
                    .patch(`/notes/${idToUpdate}`)
                    .send({bongo:'longo'})
                    .expect(400, {
                        error: {message: `Missing 'title' in request body.`}
                    })
            })
        })
    })
})