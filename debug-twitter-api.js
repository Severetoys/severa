// Teste direto das APIs do Twitter para debug de vídeos
const { default: fetch } = require('node-fetch');

const TWITTER_BEARER_TOKEN = "AAAAAAAAAAAAAAAAAAAAADCM3QEAAAAAQqCXrHYzxWZwblO%2BT4dvF7BaHzw%3D3Lrv566dJ3dVu9At9tNbHVHZJjZRVmnYnDQTJDqXsBcScHPKOO";
const RAPIDAPI_KEY = "7c3c01dff0msh8eb77407ad0be5ep1a4d2bjsnc0098af7e4fb";

async function testTwitterOfficialAPI(username = 'mkbhd') {
    console.log(`\n🔍 [DEBUG] Testando API oficial do Twitter para @${username}`);
    
    try {
        const headers = { 'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}` };

        // 1. Obter o ID do usuário
        console.log('📋 Buscando ID do usuário...');
        const userResponse = await fetch(`https://api.twitter.com/2/users/by/username/${username}`, { headers });
        
        if (!userResponse.ok) {
            console.log(`❌ Erro ao buscar usuário: ${userResponse.status}`);
            const errorText = await userResponse.text();
            console.log('Resposta:', errorText);
            return;
        }

        const userData = await userResponse.json();
        const userId = userData.data.id;
        console.log(`✅ ID do usuário: ${userId}`);

        // 2. Buscar tweets com mídia
        console.log('📋 Buscando tweets com mídia...');
        const tweetsUrl = `https://api.twitter.com/2/users/${userId}/tweets`;
        const params = new URLSearchParams({
            'max_results': '20',
            'tweet.fields': 'created_at,attachments',
            'media.fields': 'media_key,type,url,preview_image_url,variants',
            'expansions': 'attachments.media_keys'
        });

        const tweetsResponse = await fetch(`${tweetsUrl}?${params}`, { headers });
        
        if (!tweetsResponse.ok) {
            console.log(`❌ Erro ao buscar tweets: ${tweetsResponse.status}`);
            const errorText = await tweetsResponse.text();
            console.log('Resposta:', errorText);
            return;
        }

        const tweetsData = await tweetsResponse.json();
        console.log(`✅ API oficial - ${tweetsData.data?.length || 0} tweets encontrados`);
        
        if (tweetsData.includes?.media) {
            console.log(`📹 Mídias encontradas: ${tweetsData.includes.media.length}`);
            tweetsData.includes.media.forEach((media, index) => {
                console.log(`  ${index + 1}. Tipo: ${media.type}, Key: ${media.media_key}`);
                if (media.type === 'video') {
                    console.log(`     URL: ${media.url || 'N/A'}`);
                    console.log(`     Preview: ${media.preview_image_url || 'N/A'}`);
                }
            });
        } else {
            console.log('❌ Nenhuma mídia encontrada nos includes');
        }

    } catch (error) {
        console.log(`❌ Erro na API oficial: ${error.message}`);
    }
}

async function testRapidAPI(username = 'mkbhd') {
    console.log(`\n🔍 [DEBUG] Testando RapidAPI para @${username}`);
    
    try {
        const headers = {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': 'twitter-api45.p.rapidapi.com'
        };

        console.log('📋 Fazendo requisição para RapidAPI...');
        const response = await fetch(
            `https://twitter-api45.p.rapidapi.com/usermedia.php?screenname=${username}&count=20`,
            { headers }
        );

        if (!response.ok) {
            console.log(`❌ Erro na RapidAPI: ${response.status}`);
            const errorText = await response.text();
            console.log('Resposta:', errorText);
            return;
        }

        const data = await response.json();
        console.log(`✅ RapidAPI respondeu`);
        console.log('📊 Estrutura da resposta:', Object.keys(data));
        
        let tweets = [];
        if (data.timeline && Array.isArray(data.timeline)) {
            tweets = data.timeline;
        } else if (Array.isArray(data)) {
            tweets = data;
        } else if (data.data && Array.isArray(data.data)) {
            tweets = data.data;
        }

        console.log(`📋 ${tweets.length} tweets encontrados`);
        
        let videoCount = 0;
        tweets.forEach((tweet, index) => {
            console.log(`  Tweet ${index + 1}: ${JSON.stringify(tweet, null, 2).substring(0, 200)}...`);
            
            if (tweet.media && Array.isArray(tweet.media)) {
                tweet.media.forEach(m => {
                    if (m.type === 'video' || m.video_info) {
                        videoCount++;
                        console.log(`    📹 Vídeo encontrado: ${m.media_url_https || m.url}`);
                    }
                });
            }
            if (tweet.videos && Array.isArray(tweet.videos)) {
                videoCount += tweet.videos.length;
                console.log(`    📹 ${tweet.videos.length} vídeos diretos`);
            }
        });

        console.log(`📊 Total de vídeos encontrados: ${videoCount}`);

    } catch (error) {
        console.log(`❌ Erro na RapidAPI: ${error.message}`);
    }
}

async function runTests() {
    console.log('🧪 Iniciando testes das APIs do Twitter para debug de vídeos');
    
    const testUsers = ['mkbhd', 'verge', 'elonmusk'];
    
    for (const user of testUsers) {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`🔍 TESTANDO USUÁRIO: @${user}`);
        console.log(`${'='.repeat(50)}`);
        
        await testTwitterOfficialAPI(user);
        await testRapidAPI(user);
        
        console.log('\n⏱️ Aguardando 2 segundos...');
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

runTests().catch(console.error);
