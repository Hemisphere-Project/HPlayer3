
const fs = require('fs')
const { get } = require('http')
const fspath = require('path')

const ext_images = ['jpg', 'jpeg', 'png', 'gif']
const ext_videos = ['mp4', 'webm', 'mov', 'ogv']
const ext_sounds = ['mp3', 'wav', 'aiff']
const ext_text   = ['txt']


class Files {
    
    _tree = []
    path = fspath.join(__dirname, 'media') 
    count = 2

    constructor(path) {
        this.path = path

        // Build Tree
        this.buildTree() 
    }

    // Get file type
    //
    getType(file) 
    {
        var type = 'unknown'
        if (ext_images.indexOf(file.name.replace(/.*\./, '').toLowerCase()) >= 0) type = 'image'
        if (ext_videos.indexOf(file.name.replace(/.*\./, '').toLowerCase()) >= 0) type = 'video'
        if (ext_sounds.indexOf(file.name.replace(/.*\./, '').toLowerCase()) >= 0) type = 'audio'
        if (ext_text.indexOf(file.name.replace(/.*\./, '').toLowerCase()) >= 0)   type = 'text'
        if (file.isDirectory()) type = 'folder'
        return type
    }
    
    // Recursive tree from a specific relative path
    //
    #listDir(relative_path) 
    {
        if (relative_path === undefined) relative_path = "/"

        var fileTree = []
        var full_path = fspath.join(this.path, relative_path) 

        // Read directory content
        //
        fileTree=fs.readdirSync(full_path, { withFileTypes: true })
            .filter(item => !item.name.startsWith('.')) // Remove hidden files
            .map(item => ({
                name:         item.name,
                raw_name:     item.name.substring(0, item.name.lastIndexOf('.')),
                path:         fspath.join(relative_path, item.name),
                fullpath:     fspath.join(full_path, item.name),
                type:         this.getType(item)
            }));
        
        // Recursive scan for sub-directories
        //
        fileTree.forEach(item => {
            if(item.type=='folder') item.children = this.#listDir(item.path)
        });
        
        return fileTree
    }

    // Rebuild cached tree 
    //
    buildTree()
    {
        this._tree = this.#listDir()
    }

    // Get tree from cache, with optional subdirectory
    //
    getTree(relative_path)
    {   
        let filetree = this._tree

        // Dig into sub directories
        if (relative_path !== undefined) 
        {
            relative_path.split('/').forEach( (dir)=>{
                filetree = filetree
                            .find(item => (item.name == dir && item.type=='folder'))
                if (filetree) filetree = filetree.children
                else filetree = []
            })
        }

        return filetree
    }

}


module.exports = Files


