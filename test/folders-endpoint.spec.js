const knex = require('knex');
const app = require('../src/app');
const { makeFoldersArray, makeMaliciousFolders } = require('./folders.fixture');

const path = require('path');

describe('Folders Endpoints',function() {
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

    describe(`GET /folders`,()=>{
        context('given no folders',()=>{
            it(`responds with 200 and an empty list`,()=>{
                return supertest(app)
                    .get(`/folders`)
                    .expect(200, [])
            })
        })
        context('given there are folders in the database',()=>{
            const testFolders = makeFoldersArray();
            beforeEach(`insert folders`,()=>{
                return db 
                    .into('noteful_folders')
                    .insert(testFolders)
            })
            it(`responds 200 and returns the array of folders`,()=>{
                return supertest(app)
                    .get(`/folders`)
                    .expect(200, testFolders)
            })
        })
        context(`given an xss attack folder`,()=>{
            const {maliciousFolders,expectedFolders} = makeMaliciousFolders();
            beforeEach(`insert malicious folder`,()=>{
                return db 
                    .into('noteful_folders')
                    .insert(maliciousFolders)
            })
            it(`removes the XSS content and returns the folders`,()=>{
                return supertest(app)
                    .get(`/folders`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].name).to.eql(expectedFolders[0].name)
                        expect(res.body[1].name).to.eql(expectedFolders[1].name)
                    })
            })
        })
    })

    describe(`GET /folders/:folder_id`,()=>{
        context('given no folders',()=>{
            it(`responds with 404 and an error`,()=>{
                const folderId=1;
                return supertest(app)
                    .get(`/folders/${folderId}`)
                    .expect(404, {
                        error: {message: `Folder doesn't exist.`}
                    })
            })
        })
        context(`given there are folders in the database`,()=>{
            const testFolders = makeFoldersArray();
            beforeEach(`insert folders`,()=>{
                return db 
                    .into('noteful_folders')
                    .insert(testFolders)
            })
            it(`returns 200 and the correct folder`,()=>{
                const folderId = 2;
                const expectedFolder = testFolders[folderId-1];
                return supertest(app)
                    .get(`/folders/${folderId}`)
                    .expect(200, expectedFolder)
            })
        })
        context(`given an xss attack folder`,()=>{
            const {maliciousFolders , expectedFolders} = makeMaliciousFolders();
            beforeEach(`insert malicious folder`,()=>{
                return db 
                    .into('noteful_folders')
                    .insert(maliciousFolders)
            })
            it(`removes the XSS content and returns the folders`,()=>{
                const folderId = 911;
                return supertest(app)
                    .get(`/folders/${folderId}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.name).to.eql(expectedFolders[0].name)
                    })
            })
        })
    })

    describe(`POST /folders`,()=>{
        it(`creates an article and responds 201 with the new article`,()=>{
            const newFolder = {
                name: 'test folder'
            }
            return supertest(app)
                .post(`/folders`)
                .send(newFolder)
                .expect(201)
                .expect(res => {
                    expect(res.body.name).to.eql(newFolder.name)
                })
                    .then(res => {
                        return supertest(app)
                            .get(`/folders/${res.body.id}`)
                            .expect(res.body)
                    })
        })
        it(`responds 400 and an error message when name is missing`,()=>{
            return supertest(app)
                .post(`/folders`)
                .send({bongo:'longo'})
                .expect(400, {
                    error: {message: `Missing name in request body.`}
                })
        })
        it('removes XSS attack content from response', () => {
            const { maliciousFolders, expectedFolders } = makeMaliciousFolders();
            return supertest(app)
                .post(`/folders`)
                .send(maliciousFolders[0])
                .expect(201)
                .expect(res => {
                    expect(res.body.name).to.eql(expectedFolders[0].name)
                })
        })
    })

    describe(`DELETE /folders`,()=>{
        context(`given there are folders in the database`,()=>{
            const testFolders = makeFoldersArray();
            beforeEach(`insert folders`,()=>{
                return db 
                    .into('noteful_folders')
                    .insert(testFolders)
            })
            it(`should respond 204 and delete the requested folder`,()=>{
                const idToRemove = 2;
                const expectedFolders = testFolders.filter(folder => folder.id !== idToRemove);
                return supertest(app)
                    .delete(`/folders/${idToRemove}`)
                    .expect(204)
                    .then(res => {
                        return supertest(app)
                            .get(`/folders`)
                            .expect(expectedFolders)
                    }) //this does leave notes with null folder_id's, TODO
            })
        })
        context(`given there are no folders in the database`,()=>{
            it(`should respond 404 and give an error message`,()=>{
                return supertest(app)
                .delete(`/folders/69`)
                .expect(404, {
                    error: {message: `Folder doesn't exist.`}
                })
            })
        })
    })

    describe(`PATCH /folders`,()=>{
        context(`given there are no folders in the database`,()=>{
            it(`should return an error`,()=>{
                return supertest(app)
                    .patch(`/folders/1`)
                    .send({name: 'blarp'})
                    .expect(404, {
                        error: {message: `Folder doesn't exist.`}
                    })
            })
        })
        context(`given there are folders in the database`,()=>{
            const testFolders = makeFoldersArray();
            beforeEach(`insert folders`,()=>{
                return db 
                    .into('noteful_folders')
                    .insert(testFolders)
            })
            it('should update the article, return 204, return the updated folder',()=>{
                const testFolder = {name: 'test'};
                return supertest(app)
                    .patch(`/folders/1`)
                    .send(testFolder)
                    .expect(204)
                    .expect(()=>{
                        supertest(app)
                            .get(`/folders/1`)
                            .then(res=>{
                                expect(res.body.name).to.eql(testFolder.name)
                            })
                    })
            })
        })
    })
})