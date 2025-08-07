// Teste de diferentes endpoints da RapidAPI para encontrar mídia
const { default: fetch } = require('node-fetch');

const RAPIDAPI_KEY = "7c3c01dff0msh8eb77407ad0be5ep1a4d2bjsnc0098af7e4fb";

async function testDifferentEndpoints(username = 'mkbhd') {
    console.log(`\n🔍 Testando diferentes endpoints da RapidAPI para @${username}`);
    
    const headers = {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'twitter-api45.p.rapidapi.com'
    };

    const endpoints = [
        {
            name: 'User Media (atual)',
            url: `https://twitter-api45.p.rapidapi.com/usermedia.php?screenname=${username}&count=10`
        },
        {
            name: 'User Timeline',
            url: `https://twitter-api45.p.rapidapi.com/timeline.php?screenname=${username}&count=10`
        },
        {
            name: 'User Tweets',
            url: `https://twitter-api45.p.rapidapi.com/usertweets.php?screenname=${username}&count=10`
        }
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`\n📋 Testando: ${endpoint.name}`);
            console.log(`🔗 URL: ${endpoint.url}`);
            
            const response = await fetch(endpoint.url, { headers });
            
            if (!response.ok) {
                console.log(`❌ Erro: ${response.status}`);
                continue;
            }

            const data = await response.json();
            console.log(`✅ Resposta recebida`);
            console.log(`📊 Estrutura: ${Object.keys(data)}`);
            
            let tweets = [];
            if (data.timeline && Array.isArray(data.timeline)) {
                tweets = data.timeline;
            } else if (Array.isArray(data)) {
                tweets = data;
            } else if (data.tweets && Array.isArray(data.tweets)) {
                tweets = data.tweets;
            }

            console.log(`📋 ${tweets.length} tweets encontrados`);
            
            if (tweets.length > 0) {
                const firstTweet = tweets[0];
                console.log(`🔍 Estrutura do primeiro tweet:`);
                console.log(`   - Campos disponíveis: ${Object.keys(firstTweet)}`);
                
                // Procurar por campos relacionados a mídia
                const mediaFields = Object.keys(firstTweet).filter(key => 
                    key.toLowerCase().includes('media') || 
                    key.toLowerCase().includes('video') || 
                    key.toLowerCase().includes('photo') ||
                    key.toLowerCase().includes('image')
                );
                
                if (mediaFields.length > 0) {
                    console.log(`📹 Campos de mídia encontrados: ${mediaFields}`);
                    mediaFields.forEach(field => {
                        console.log(`   ${field}: ${JSON.stringify(firstTweet[field]).substring(0, 100)}...`);
                    });
                } else {
                    console.log(`❌ Nenhum campo de mídia encontrado`);
                }
                
                // Mostrar tweet completo se pequeno
                if (JSON.stringify(firstTweet).length < 500) {
                    console.log(`📄 Tweet completo: ${JSON.stringify(firstTweet, null, 2)}`);
                }
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.log(`❌ Erro no endpoint ${endpoint.name}: ${error.message}`);
        }
    }
}

testDifferentEndpoints('mkbhd').catch(console.error);
