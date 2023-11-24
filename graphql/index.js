const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const connection = require('./db');

// Schéma GraphQL
const schema = buildSchema(`
    type Query {
        user(id: ID!): User
        usersByEmail(email: String!): User
        post(id: ID!): Post
        posts: [Post]
        users: [User]
    }

    type Mutation {
        addPost(
        title: String!, 
        content: String!, 
        authorId: ID!): Post
        addUser(
        title: String!, 
        content: String!, 
        authorId: ID!): Post
    }

    type User {
        id: ID!
        firstname: String
        lastname: String
        email: String
        posts: [Post]
    }

    type Post {
        id: ID!
        title: String
        content: String
        user: User  
    }
`);

// Résolveurs
const root = {
    user: ({ id }) => {
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM users WHERE id = ?',[id], (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }
                let user = result[0]
                connection.query('SELECT * FROM posts WHERE user_id = ?', [id], (error, postsResults) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    // Associer les posts à l'utilisateur
                    user.posts = postsResults;
                    resolve(user);
                });
            })
        })
    },

    users: async () => {
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM users', (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }
                const promises = results.map(user => {
                    return new Promise((resolvePosts, rejectPosts) => {
                        connection.query('SELECT * FROM posts WHERE user_id = ?', [user.id], (error, postsResults) => {
                            if (error) {
                                rejectPosts(error);
                                return;
                            }
    
                            // Associer les posts à l'utilisateur
                            user.posts = postsResults;
                            resolvePosts();
                        });
                    });
                })
                Promise.all(promises)
                .then(() => {
                    resolve(results);
                })
                .catch(error => {
                    reject(error);
                });
            });
        });
    },

    usersByEmail: ({ email }) => {
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM users WHERE email = ?',[email], (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }
                if (!result[0]){
                    resolve();
                    return
                }
                let user = result[0]
                connection.query('SELECT * FROM posts WHERE user_id = ?', [user.id], (error, postsResults) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    user.posts = postsResults;
                    resolve(user);
                });
            })
        })
    },

    post: ({ id }) => {
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM posts WHERE id = ?', [id], (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }
                if (!result[0]){
                    resolve();
                    return
                }
                let post = result[0]
                connection.query('SELECT * FROM users WHERE id = ?', [post.user_id], (error, postsResults) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    delete post.user_id
                    post.user = postsResults[0];
                    resolve(post);
                });
            })
        })
    },

    posts: () => {
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM posts', (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }
                const promises = results.map(post => {
                    return new Promise((resolvePosts, rejectPosts) => {
                        connection.query('SELECT * FROM users WHERE id = ?', [post.user_id], (error, postsResults) => {
                            if (error) {
                                rejectPosts(error);
                                return;
                            }

                            // Associer les posts à l'utilisateur
                            post.user = postsResults[0];
                            resolvePosts();
                        });
                    });
                })
                Promise.all(promises)
                .then(() => {
                    resolve(results);
                })
                .catch(error => {
                    reject(error);
                });
            });
        });
    },

    addPost: ({ title, content, authorId }) => {
        return new Promise((resolve, reject) => {
            connection.query('INSERT INTO posts (title, content, user_id) VALUES (?,?,?)', [title,content,authorId], (error, postsResults) => {
                if (error) {
                    reject(error);postsResults.insertId
                    return;
                }

                connection.query('SELECT * from posts WHERE id = ?', [postsResults.insertId], (error, post) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    connection.query('SELECT * from users WHERE id = ?', [post[0].user_id], (error, user) => {
                        if (error) {
                            reject(error);
                            return;
                        }

                        let postToReturn = post[0]
                        postToReturn.user = user[0]

                        resolve(postToReturn)
                    });
                });
            });
        })
    }
};

// Création du serveur Express
const app = express();
app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: root
}));

// Lancement du serveur
app.listen(4000, () => console.log('Serveur GraphQL lancé sur http://localhost:4000/graphql'));