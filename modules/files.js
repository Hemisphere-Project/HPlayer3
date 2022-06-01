
const fs = require('fs')
const { get } = require('http')
const fspath = require('path')
const chokidar = require('chokidar')

const ext_images = ['jpg', 'jpeg', 'png', 'gif']
const ext_videos = ['mp4', 'webm', 'mov', 'ogv']
const ext_sounds = ['mp3', 'wav', 'aiff']
const ext_text   = ['txt']


class Files {
    
    mytree = []
    path = fspath.join(__dirname, 'media') 

    constructor(path) {
        this.path = path

        this.watcher = chokidar.watch(this.path, {ignored: /^\./, persistent: true});
        this.watcher
            .on('add',    path => {this.debounceRefresh()})
            .on('change', path => {this.debounceRefresh()})
            .on('unlink', path => {this.debounceRefresh()})
        
        
    }

    // Watcher debounce -> rebuild tree
    //
    debounceRefresh()
    {
        clearTimeout(this.refreshTimer)
        this.refreshTimer = setTimeout( () => {this.buildTree()}, 100)
        
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
    
    // Recursive tree from a specific relative path (private -> use getTree() !)
    //
    listDir(relative_path) 
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
            if(item.type=='folder') item.children = this.listDir(item.path)
        });
        
        return fileTree
    }

    // Rebuild cached tree 
    //
    buildTree()
    {
        this.mytree = this.listDir()
        this.log(this.path, 'updated')
    }

    // Get tree from cache, with optional subdirectory
    //
    getTree(relative_path)
    {   
        let tree = this.mytree
        
        // Dig into sub directories
        if (relative_path !== undefined) 
        {
            relative_path.split('/').forEach( (dir)=>{
                tree = tree
                .find(item => (item.name == dir && item.type=='folder'))
                if (tree) tree = tree.children
                else tree = []
            })
        }
        else relative_path = ''
        
        return {path: fspath.join(this.path, relative_path)+'/' , fileTree: tree}
    }

    // Delete file
    //
    delete(path)
    {
        this.log('deleting',path)
        
        if (!path.startsWith(this.path)) {
            throw "Can't delete a file outside the base path";
            return
        }

        fs.unlink(path, err => {
            if (err) throw err;
            else this.log('deleted '+path)
            this.buildTree()
        })
    }

    // Rename file
    //
    rename(oldpath, newpath)
    {
        this.log('renaming', oldpath, newpath)

        if (!oldpath.startsWith(this.path) || !newpath.startsWith(this.path)) {
            throw "Can't rename a file outside the base path";
            return
        }

        fs.rename( oldpath, newpath, err => {
            if (err) throw err;
            else this.log('renamed '+newpath)
            this.buildTree()
          })
    }

    log(...v) {
        console.log(`[files]`, ...v)
      }

}


module.exports = Files


