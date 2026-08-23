interface FileNode{
    kind:'file';
    content:string;

}

interface DirNode{
    kind:'dir';
    children:Map<string,FSNode>;
}

type FSNode=DirNode | FileNode;

class inMemFileSystem{
  
    private root: DirNode;

    constructor(){
        this.root=this.createDirNode();
    }

   private createFileNode():FileNode{
     return {
        kind:'file',
        content:''
     };
   }

   private createDirNode():DirNode{
     return {
        kind:'dir',
        children:new Map<string,FSNode>()
     };
   }

   private resolve(path:string, createMissing:boolean): FSNode | null{
     
      let start:FSNode=this.root;
      const pathArray=path.split('/').filter(Boolean);

      
      for(let i=0;i<pathArray.length;i++){
          
        if(start.kind!=='dir')
            return null;

        if(!start.children.has(pathArray[i])){

            if(createMissing)
            start.children.set(pathArray[i], this.createDirNode());
            else return null;

        }

        start=start.children.get(pathArray[i])!;

      }

      return start;

   }


 ls(path:string): string[] | null{

    const result:string[]=[];
   
   let node=this.resolve(path,false);

   if(node===null)
    return null;

   if(node.kind==='file'){
    const name=path.split('/').filter(Boolean);
    result.push(name[name.length-1]);
    return result;
   }

   for(const childname of node.children.keys())
    result.push(childname);

   result.sort();

   return result;

}

 mkdir(path:string): void{

    this.resolve(path,true);
}

 addContentToFile(path:string, content:string): void {
    
    const AbsolutePath=path.split('/').filter(Boolean);
    
    let dirPath:string='';

    for(let i=0;i<AbsolutePath.length-1;i++)
        dirPath+= '/' + AbsolutePath[i];

    let node=this.resolve(dirPath,true);
    
    if(node && node.kind==='dir' ){
     if(!node.children.get(AbsolutePath[AbsolutePath.length-1]))
      node.children.set(AbsolutePath[AbsolutePath.length-1],this.createFileNode());
    
     const newNode =node.children.get(AbsolutePath[AbsolutePath.length-1]);
     
     if(newNode && newNode.kind==='file')
     newNode.content+=content;
    }
}

 readContentFromFile(path: string): string | null {

    const node=this.resolve(path,false);

    if(node===null)
        return null;

    if(node.kind==='file')
        return node.content;

    return null;
 }

}


// The kind field is the discriminant: a literal string type, not string. That's what lets the compiler narrow. Three things to internalize:

// Narrowing: after if (node.kind === 'file'), TypeScript knows node is FileNode inside that block — node.content compiles, node.children is a compile error. No casts, no !.
// Illegal states are unrepresentable: a node can no longer be "a file with children" or "a directory with content", because neither type has both fields. Bug 3 from that review becomes impossible to write, not just impossible to hit.
// Notice what disappeared: name is gone entirely. A node's name lives in its parent's children map key — storing it on the node was duplicated state (and it was only ever set for files, which was the smell). ls on a file path derives the name from the path string: last element of the split.
// Watch the casing — 'file' and 'File' are different types. Pick lowercase and use it everywhere, including the root literal: { kind: 'dir', children: new Map() }.


// run tc and sc and rewrite 


const ops  = ["ls", "mkdir", "addContentToFile", "ls", "readContentFromFile"];
const args = [["/"], ["/a/b/c"], ["/a/b/c/d", "hello"], ["/"], ["/a/b/c/d"]];

const FileSys= new inMemFileSystem();

 for(let i=0; i<ops.length;i++){

    let out:any;

    switch(ops[i]){

        case "ls" : out=FileSys.ls(args[i][0]); break;
        case "mkdir" : out=FileSys.mkdir(args[i][0]); break;
        case "addContentToFile" : out=FileSys.addContentToFile(args[i][0],args[i][1]); break;
        case "readContentFromFile" : out=FileSys.readContentFromFile(args[i][0]); break;
    }
    console.log(`${ops[i]}, ${args[i]}`," =>", out);
 }

