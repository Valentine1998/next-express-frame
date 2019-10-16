import fetch from "isomorphic-unfetch";

const Index = props => <div>Hello! {props.messages.message} </div>;

Index.getInitialProps = async function() {
   const res = await fetch("http://localhost:3000/api/messages");
   const data = await res.json();
   console.log(data);
   return {
      messages: data
   };
};
export default Index;
