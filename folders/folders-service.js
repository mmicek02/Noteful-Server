const FoldersService = {
    getAllFolders(knex) {
        return knex.select('*').from('noteful_folders')
    },
    insertFolder(knex, newFolder){
        return knex
            .insert(newFolder)
            .into('noteful_folders')
            .returning('*')
            .then(rows => {
                return rows[0] //.returning() will return an array of one item, and we only want to return the item itself
            })
    },
    getById(knex, id) {
        return knex
            .from('noteful_folders')
            .select('*')
            .where('id', id)
            .first();
    },
    deleteFolder(knex, id) {
        return knex('noteful_folders')
            .where({id})
            .delete()
    },
    updateFolder(knex, id, newFoldersField) {
        return knex('noteful_folders')
            .where({id})
            .update(newFoldersField)
    },
};

module.exports = FoldersService;