export type User ={
    name:string;
    number:string;
    active:boolean;
    id?:string;
}

export type toChangeCurrentUser =(arg:User)=>void