

// normalize new user structure to the old one

export const normalizeUsers=(user)=>{
    return {...user,id:user?.id,botUuid:user?.id}
}