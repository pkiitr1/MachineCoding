// ls, mkdir, addContent, readContent

import { file } from "googleapis/build/src/apis/file";


interface FileNode{
    kind:"file",
    content:string;
}

interface DirNode{

    kind:"dir";
    children:Map<string,FSNode>;
}

type FSNode= DirNode | FileNode;


class inMemFileSystem{

    private root:DirNode;

    constructor(){
        this.root=this.createDirNode();
    }

    private createDirNode():DirNode{

        return{
            kind:"dir",
           children:new Map<string,FSNode>()
        };
    }

    private createFileNode():FileNode{

        return{
            kind:"file",
            content:""
        };
    }

    private resolve(path:string,createMissing:boolean):FSNode | null{

        let start:FSNode=this.root;

        const pathComponent=path.split('/').filter(Boolean);

        for(const seg of pathComponent){

            if(start.kind!=="dir")
                return null;

            if(!start.children.has(seg)){

                if(createMissing)
                    start.children.set(seg,this.createDirNode());
                else return null;
            }

            start=start.children.get(seg)!;

        }
        return start;
    }

    ls(path:string):string[] | null{

        let start=this.resolve(path,false);
        let result:string[]=[];

        if(start==null)
            return null;


        if(start.kind=="file"){
           
           const absolutePath=path.split('/').filter(Boolean);

           result.push(absolutePath[absolutePath.length-1]);
           return result;
        }

        for(const children of start.children.keys()){

            result.push(children);
        }
        
        result.sort();
        return result;
    }

    mkidr(path:string):void{

        let start=this.resolve(path,true);
    }

    addContentToFile(path:string,content:string):void{
        
        const absolutePath=path.split('/').filter(Boolean);
        
        let dirPath:string='';

        for(let i=0; i<absolutePath.length-1;i++)
         dirPath='/' + absolutePath[i];

        let start=this.resolve(dirPath,true);

        if(start==null)
            return ;
        
        const fileName=absolutePath[absolutePath.length-1];

        if(start.kind=="dir"){

            if(!start.children.has(fileName))
                start.children.set(fileName,this.createFileNode());

            start=start.children.get(fileName)!;
        }
        
        if(start.kind=="file")
        start.content+=content;      

    }

    readContentFromFile(path:string):string | null{

         let start=this.resolve(path,false);

            return start && start.kind=="file" ? start.content :null;
    }




}