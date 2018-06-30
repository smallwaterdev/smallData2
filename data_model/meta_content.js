
class MetaContent{
    constructor(domain){

        this.data = {
            domain:domain, // porn site domain, e.g. javseen, ...
            name:"",
            value:null
        }
    }
    setDomain(value){
        this.data.domain = value;
    }
    getDomain(){
        return this.data.domain;
    }
    setData(data){
        this.data = data;
    }
    getData(){
        return this.data;
    }
    setName(value){
        this.data.name = value;
    }
    getName(){
        return this.data.name;
    }
    setValue(value){
        this.data.value = value;
    }
    getValue(){
        this.data.value;
    }
    
}

module.exports = MetaContent;