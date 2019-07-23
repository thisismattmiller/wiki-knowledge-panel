var wikiCards = {
    
    
    prefLangs: ["en","es","zh","tl","vi","ar","fr","de","ko"],
    
    init: function(prefLanguage){
        
        // find all the possible cards
        document.querySelectorAll(".wiki-knowledge-card").forEach((wc)=>{
            
            wc.innerHTML = ""
            
            this.parseQId(wc.dataset.qid, (data)=>{
                        
                // find the first lang we should use, pick a default one if one of our prefs arent found
                var useLang = data[Object.keys(data)[0]]
                for (lang in wikiCards.prefLangs){                
                    if (Object.keys(data).indexOf(wikiCards.prefLangs[lang]) > -1){                        
                        useLang = data[wikiCards.prefLangs[lang]]
                        break
                    }              
                }
                
                // if we passed a lang code, assume it is present in the data and look for it
                if (prefLanguage){
                   for (key in data){
                       if (key ==prefLanguage){
                           useLang = data[key]
                       }
                   }               
                }

                // now build the interface for that lang
                wikiCards.downloadKnowledgeCard(useLang)
                
            })
            


        })
        
        
        
        
        
    },
    
    downloadKnowledgeCard: function(data){
        
        data.articleText = ""
        data.thumbUrl = ""
        
        // grab the thumb and atricle text
        wikiCards.utilGetJson(data.articleInfoUrl,function(articleData){
            if (articleData && articleData.query && articleData.query.pages && Object.keys(articleData.query.pages).length > 0){

                var d = articleData.query.pages[Object.keys(articleData.query.pages)[0]]
                if (d && d.extract){
                    data.articleText = d.extract
                }
            }
            
             wikiCards.utilGetJson(data.thumbInfoUrl,function(articleData){
                 if (articleData && articleData.query && articleData.query.pages && Object.keys(articleData.query.pages).length > 0){
     
                     var d = articleData.query.pages[Object.keys(articleData.query.pages)[0]]
                     // test if it is a landscape or portrait image
                     if (d && d.thumbnail && d.thumbnail.source){
                         if (d.thumbnail.height > d.thumbnail.width){
                            data.thumbType = 'p'
                         }else{
                            data.thumbType = 'l'
                         }
                         
                         data.thumbUrl = d.thumbnail.source
                     }
                 }
                 
                 
                 
                 wikiCards.buildKnowledgeCard(data)
                 
                 
             },function(){})            
            
            
        },function(){})
        
    },
    
    buildKnowledgeCard: function(data){
        
        // look for the right place to build the card
        document.querySelectorAll(".wiki-knowledge-card").forEach((wc)=>{
            
            if (wc.dataset.qid == data.qid){
            
                if (data.thumbUrl != ""){
                    var image = document.createElement('div')
                    if (data.thumbType=="l"){
                        image.classList.add('knowledge-card-wiki-image')
                    }else{
                        image.classList.add('knowledge-card-wiki-image-portrait')
                    }
                    image.style.backgroundImage = 'url(' + data.thumbUrl + ')';
                    image.setAttribute('alt','Image of ' + data.title +' from Wikipedia')
                    image.setAttribute('title','Image of ' + data.title +' from Wikipedia')
                    
                    wc.appendChild(image)
               }
                if (data.title){
                    var title = document.createElement('div')
                    title.classList.add('knowledge-card-wiki-title')
                    title.innerHTML = data.title
                    wc.appendChild(title)                    
                    
                }
                if (data.articleText != ""){
                    var cutoff = 500
                    var text = document.createElement('div')
                    text.classList.add('knowledge-card-wiki-text')
                    if (data.articleText.length>cutoff){
                        text.innerHTML = data.articleText.substring(0,cutoff) + '...'    
                    }else{
                        text.innerHTML = data.articleText
                    }
                    
                    wc.appendChild(text)
               }
               
                var wikiMenu = document.createElement('div')
                wikiMenu.classList.add('knowledge-card-wiki-menu')
                wikiMenu.innerHTML=""
                var wikiLinks = document.createElement('div')
                
                wikiLinks.classList.add('knowledge-card-wiki-wikiLinks')
                
                var wikipediaLink = document.createElement('a')
                wikipediaLink.setAttribute('href',data.link)
                wikipediaLink.setAttribute('title','Data from Wikipedia')
                wikipediaLink.innerHTML="Wikipedia"
                wikiLinks.appendChild(wikipediaLink)

                var wikidataLink = document.createElement('a')
                wikipediaLink.setAttribute('title','Data from Wikidata')
                wikidataLink.setAttribute('href','https://www.wikidata.org/entity/' + data.qid)
                wikidataLink.innerHTML="Wikidata"
                wikiLinks.appendChild(wikidataLink)
                
                wikiMenu.appendChild(wikiLinks)

                var wikiLangs = document.createElement('div')
                wikiLangs.innerHTML = "Languages:&nbsp;"
                wikiCards.prefLangs.forEach((l)=>{
                    
                    if (Object.keys(data.allData).indexOf(l) >-1){
                        if (data.lang == l){
                            var llink = document.createElement('span')
                            llink.style.marginRight='5px'
                            llink.innerHTML=l
                            wikiLangs.appendChild(llink)                                                        
                        }else{
                            var llink = document.createElement('a')
                            llink.innerHTML=l
                            llink.setAttribute('href','#')

                            llink.addEventListener('click',function (event)
                                {
                                    wikiCards.init(event.target.innerText)
                                    event.preventDefault();
                                }  ); 
                            
                            
                            wikiLangs.appendChild(llink)                            
                            
                        }

                    }
                    
                })
                
                var langSelect = document.createElement('select')
                Object.keys(data.allData).forEach((l)=>{
                    var langOpt = document.createElement('option')
                    langOpt.setAttribute('value',l)
                    langOpt.innerHTML=l
                    if (data.lang == l){
                        langOpt.setAttribute('selected',true)
                    }
                    langSelect.appendChild(langOpt)
                })
                
                langSelect.addEventListener('change',function (event)
                {
                    wikiCards.init(event.target.value)
                    event.preventDefault();
                }  );                 
                
                wikiLangs.appendChild(langSelect)                            
                
                wikiMenu.appendChild(wikiLangs)
                
                
                
                
                
                
                wc.appendChild(wikiMenu)
                
            }
        
        
        })
        
        
    },
    
    parseQId: function(qid,callback){
        
        this.utilGetJson('https://www.wikidata.org/wiki/Special:EntityData/'+qid+'.json',function(data){
           
            if (data && data.entities && data.entities[qid]){
                var labels = data.entities[qid].labels
                var sitelinks = data.entities[qid].sitelinks
                var data = {}
                
                Object.keys(sitelinks).forEach((sl)=>{
                    var lang = sl.split('wiki')[0]
                    if (lang.indexOf('_old')>-1){
                        return false;
                    }
                    var articleTitle = sitelinks[sl].url.split('/wiki/')[1]
                    var articleServer = sitelinks[sl].url.split('/wiki/')[0]
                    var wikiThumb = articleServer + '/w/api.php?action=query&titles=' + articleTitle  + '&prop=pageimages&format=json&pithumbsize=640&origin=*'
                    var articleText = articleServer + '/w/api.php?format=json&action=query&prop=extracts&exintro=1&explaintext=1&titles=' + articleTitle + '&origin=*'
                    var title = sitelinks[sl].title
                    var link = sitelinks[sl].url
                    
                    if (link.indexOf('wikipedia')>-1){                       
                       data[lang] = {
                           qid : qid,
                           lang : lang,
                           titleEncoded: articleTitle,
                           server: articleServer,
                           thumbInfoUrl: wikiThumb,
                           articleInfoUrl: articleText,
                           title: title,
                           link: link,
                           allData: data
                       }
                    }                    
                })
                callback(data)
            }
            
            
        },
        function(){console.log("Error loading data")}
        )
        
        
        
    },
        
    utilGetJson: function(url,doneCb, errorCb){
    
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        
        request.onload = function() {
          if (request.status >= 200 && request.status < 400) {
            // Success!
            var data = JSON.parse(request.responseText);
            doneCb(data)
          } else {
            // We reached our target server, but it returned an error
            errorCb(request.responseText)
          }
        };
        
        request.onerror = function() {
          // There was a connection error of some sort
          errorCb()
        };
        
        request.send();



        
    }
    
    
    
}




