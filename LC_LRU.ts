
// basic approch


// use array to store the pair 

// get 

//  search the key if found erase the key and push it back -> this way it will be updated
//  else return -1

// put 
 
//  search the key if found update the value and erase, push it back -> this will it will be updated
//  else if size==capacity delete from front and push the new key in the back


// optimal approach
 
// use DLL because erase  is O(n) and traverse is O(n) 
    
//   single list solves the problem of deletion 
//   but it doesnt address traverse and reconnecting with next and prev Node

//   DLL solves this and map solves reaching at particular address 


// function resolve -> this erases the current node and pushes in the front and updates the value

// get 
 
//  check in the map if value present then  resolve({key,value})
//  return the key
//  else return -1

// put 

//  check if present in the map if true then resolve({key,value})
//  else if size==capacity delete from the back dele from the map
//  add in the front and update in map  (this covers else of above and default case)


class ListNode {
    prev: ListNode;
    next:ListNode;
    constructor(public key:number,public value:number){
        this.prev=this;
        this.next=this;
    }
}

class LRU {

    private head:ListNode; 
    private tail:ListNode;
    private map: Map<number,ListNode>;
    private capacity: number;

    constructor(num:number){
        this.head=new ListNode(NaN,NaN);
        this.tail= new ListNode(NaN,NaN);

        this.head.next=this.tail;
        this.tail.prev=this.head;

        this.map=new Map();
        this.capacity=num;
    }
    
    private insertAtFront(node:ListNode){
       
      // h->t
      // h<-t
      // temp =h.next
      // h.next=a
      // a.next=temp
      // a.prev=h
      // temp.prev=a

      const temp=this.head.next;
      this.head.next=node;
      node.prev=this.head;
      node.next=temp;
      temp.prev=node;


    }

    private unlink(node:ListNode){
     
        // h->a->b->c->t
        node.next.prev=node.prev;
        node.prev.next=node.next;

    }

    get(key:number):number{
     
         if(this.map.has(key)){
            this.unlink(this.map.get(key)!);
            this.insertAtFront(this.map.get(key)!);

            return this.map.get(key)!.value;
         }
         
         return -1;

    }

   put( key:number, value:number):void{
      
     if(this.map.has(key)){

         this.unlink(this.map.get(key)!);
         this.insertAtFront(this.map.get(key)!);
         
         this.map.get(key)!.value=value;
         return;

     }

     else if(this.map.size===this.capacity){
        
        const temp=this.tail.prev.key;
        this.unlink(this.tail.prev);
        this.map.delete(temp);
     }
     
     const NewNode=new ListNode(key,value);
     this.insertAtFront(NewNode);
     this.map.set(key,NewNode);
     return;

   }

}


