/* English Daily - грамматика: мини-теория + упражнения. theory - HTML, ответы MC (opts+a) или ввод (accepted) */
window.GRAMMAR = [
{id:"g-tenses",title:"Времена: Present Perfect vs Past Simple",blurb:"Главная ловушка русскоговорящих",
theory:[
"<b>Past Simple</b> - действие в законченном прошлом, время указано или понятно: <i>I visited London in 2024. She called an hour ago.</i>",
"<b>Present Perfect</b> - результат к настоящему моменту, время не названо: <i>I have visited London twice. She has just called.</i>",
"Маркеры Past Simple: yesterday, ago, last week, in 2020, when I was 10. Маркеры Present Perfect: just, already, yet, ever, never, since, for, recently, this week (неделя ещё идёт).",
"Правило-выручалка: есть «когда?» в прошлом - Past Simple. Важен факт/результат «к сейчас» - Present Perfect. И никогда: <s>I have seen him yesterday</s>."],
ex:[
{q:"I ___ my keys - I can't open the door!",opts:["lost","have lost","was losing","lose"],a:1,why:"Результат к настоящему (не могу открыть) → Present Perfect."},
{q:"She ___ to Japan three years ago.",opts:["has gone","has been","went","goes"],a:2,why:"Указано время (three years ago) → Past Simple."},
{q:"___ you ever ___ sushi?",opts:["Did / try","Have / tried","Do / try","Had / tried"],a:1,why:"Опыт за жизнь без указания времени (ever) → Present Perfect."},
{q:"We ___ each other since primary school.",opts:["know","knew","have known","are knowing"],a:2,why:"since + точка в прошлом, состояние продолжается → Present Perfect."},
{q:"Впиши глагол: I ___ (finish) my homework already, let's go out.",accepted:["have finished","'ve finished","have already finished"],why:"already → Present Perfect: have finished."},
{q:"Впиши глагол: They ___ (move) to Sochi last winter.",accepted:["moved"],why:"last winter → Past Simple: moved."},
{q:"Choose the correct sentence:",opts:["I have seen this film last week.","I saw this film last week.","I see this film last week.","I have saw this film last week."],a:1,why:"last week → Past Simple. Present Perfect с указанием времени не дружит."},
{q:"He ___ his phone twice this month.",opts:["lost","has lost","loses","was losing"],a:1,why:"this month - месяц ещё не кончился → Present Perfect."},
{q:"Впиши глагол: She ___ (not/reply) to my message yet.",accepted:["hasn't replied","has not replied"],why:"yet → Present Perfect в отрицании: hasn't replied."}]},

{id:"g-articles",title:"Артикли: a / the / без артикля",blurb:"Система вместо угадывания",
theory:[
"<b>a/an</b> - «один из многих», впервые упомянутый, исчисляемый в ед. числе: <i>I saw a dog. She is a doctor.</i>",
"<b>the</b> - конкретный, известный обоим, единственный в своём роде: <i>the dog we saw, the sun, the best day</i>. Также: the UK, the USA, the cinema, the guitar (играть на).",
"<b>Без артикля</b>: множественное и неисчисляемое в общем смысле (<i>I like coffee. Cats are independent</i>), имена, города, большинство стран, school/work/home в функции (<i>go to school, at work, go home</i>).",
"Проверка: могу указать пальцем или оба понимаем «который» → the. «Какой-то, один из» → a. Говорю о явлении вообще → без артикля."],
ex:[
{q:"She wants to be ___ engineer.",opts:["a","an","the","-"],a:1,why:"Профессия, ед. число, начинается с гласного звука → an."},
{q:"___ life is full of surprises.",opts:["A","An","The","-"],a:3,why:"Абстрактное понятие в общем смысле → без артикля."},
{q:"Can you pass me ___ salt, please?",opts:["a","an","the","-"],a:2,why:"Конкретная соль на этом столе, оба понимают какая → the."},
{q:"I go to ___ school by bus.",opts:["a","an","the","-"],a:3,why:"school как функция (учиться), не здание → без артикля."},
{q:"Впиши артикль (a/an/the/-): We watched ___ amazing film, and ___ film was about space.",accepted:["an, the","an the","an,the"],why:"Первое упоминание → an, повторное → the."},
{q:"He plays ___ piano really well.",opts:["a","an","the","-"],a:2,why:"Музыкальные инструменты с play → the piano."},
{q:"Choose the correct sentence:",opts:["The Moscow is a big city.","Moscow is the big city.","Moscow is a big city.","Moscow is big city."],a:2,why:"Города без артикля; big city - «один из больших» → a."},
{q:"It was ___ best decision of my life.",opts:["a","an","the","-"],a:2,why:"Превосходная степень (best) → всегда the."},
{q:"Впиши артикль (a/an/the/-): I had ___ breakfast at home.",accepted:["-","no article","без артикля"],why:"Приёмы пищи (breakfast, lunch, dinner) → без артикля."}]},

{id:"g-prepositions",title:"Предлоги: время, место, устойчивые пары",blurb:"in/on/at и глагольные связки",
theory:[
"<b>Время:</b> at 5 o'clock, at night, at the weekend · on Monday, on 5 May, on my birthday · in June, in 2026, in the morning, in an hour (через час).",
"<b>Место:</b> at - точка (at school, at the bus stop) · in - внутри (in the room, in Sochi) · on - на поверхности (on the table, on the wall).",
"<b>Пары-ловушки:</b> depend <b>on</b>, listen <b>to</b>, wait <b>for</b>, good <b>at</b>, interested <b>in</b>, afraid <b>of</b>, arrive <b>in</b> a city / <b>at</b> a place, responsible <b>for</b>.",
"Учи предлог вместе со словом как единое целое: не «depend», а «depend on»."],
ex:[
{q:"The lesson starts ___ 9 o'clock ___ Monday.",opts:["at / on","on / at","in / on","at / in"],a:0,why:"Точное время → at, день недели → on."},
{q:"She is really good ___ maths.",opts:["in","at","on","with"],a:1,why:"good at - устойчивая пара."},
{q:"We arrived ___ Istanbul late at night.",opts:["to","at","in","on"],a:2,why:"arrive in + город/страна; arrive at + точка (airport, station)."},
{q:"Впиши предлог: It depends ___ the weather.",accepted:["on"],why:"depend on - всегда on."},
{q:"Впиши предлог: I've been waiting ___ you for twenty minutes!",accepted:["for"],why:"wait for someone."},
{q:"My birthday is ___ July.",opts:["at","on","in","by"],a:2,why:"Месяц → in."},
{q:"He is interested ___ starting his own business.",opts:["on","about","in","for"],a:2,why:"interested in + существительное/герундий."},
{q:"The keys are ___ the table ___ the kitchen.",opts:["on / in","in / on","at / in","on / at"],a:0,why:"Поверхность → on the table, внутри помещения → in the kitchen."},
{q:"Впиши предлог: Who is responsible ___ this project?",accepted:["for"],why:"responsible for something."}]},

{id:"g-conditionals",title:"Условные предложения: 0, 1, 2, 3",blurb:"If-предложения без паники",
theory:[
"<b>Zero</b> (всегда так): If + Present, Present. <i>If you heat ice, it melts.</i>",
"<b>First</b> (реально в будущем): If + Present, will + V. <i>If it rains, we will stay home.</i> Никогда: <s>if it will rain</s>.",
"<b>Second</b> (нереально сейчас, фантазия): If + Past, would + V. <i>If I had a million, I would travel.</i> С be часто were: <i>If I were you...</i>",
"<b>Third</b> (нереально в прошлом, сожаление): If + Past Perfect, would have + V3. <i>If I had studied, I would have passed.</i>"],
ex:[
{q:"If it ___ tomorrow, we will cancel the picnic.",opts:["will rain","rains","rained","would rain"],a:1,why:"First conditional: в if-части Present Simple, will только в главной."},
{q:"If I ___ you, I would apologise first.",opts:["am","was being","were","will be"],a:2,why:"Second conditional, совет: If I were you..."},
{q:"If she had left earlier, she ___ the train.",opts:["would catch","would have caught","caught","will catch"],a:1,why:"Third conditional: would have + V3 - сожаление о прошлом."},
{q:"Water boils if you ___ it to 100 degrees.",opts:["will heat","heated","heat","would heat"],a:2,why:"Zero conditional: закон природы, оба Present."},
{q:"Впиши глагол: If I ___ (have) more free time, I would learn Spanish too.",accepted:["had"],why:"Second conditional: If + Past Simple."},
{q:"Впиши глаголы: If you ___ (study) tonight, you ___ (pass) the test tomorrow.",accepted:["study, will pass","study will pass","study, you will pass"],why:"First conditional: Present + will."},
{q:"Choose the correct sentence:",opts:["If I will see him, I will tell him.","If I see him, I will tell him.","If I saw him, I will tell him.","If I see him, I would tell him."],a:1,why:"В if-части will не ставится: If I see him, I will tell him."},
{q:"If we ___ the map, we wouldn't have got lost.",opts:["took","had taken","take","would take"],a:1,why:"Third conditional: If + Past Perfect (had taken)."},
{q:"Впиши глагол: If I ___ (be) taller, I would play basketball.",accepted:["were","was"],why:"Second conditional: were (was допустимо в разговорной речи)."}]},

{id:"g-passive",title:"Пассивный залог",blurb:"be + V3 во всех временах",
theory:[
"Формула: <b>be (в нужном времени) + V3</b>. <i>The letter is written / was written / has been written / will be written.</i>",
"Пассив нужен, когда важнее действие, а не деятель: <i>English is spoken here. The bridge was built in 1932.</i>",
"Деятель добавляется через by: <i>The novel was written by Orwell</i> - но чаще by-фраза не нужна вовсе.",
"Ловушка: не забывай менять be по временам и числам: <i>The results are announced weekly. The winner was announced yesterday.</i>"],
ex:[
{q:"This bridge ___ over a hundred years ago.",opts:["built","was built","is built","has built"],a:1,why:"Прошлое, время указано → was built."},
{q:"English ___ in more than fifty countries.",opts:["speaks","is spoken","spoke","is speaking"],a:1,why:"Факт в настоящем, деятель неважен → is spoken."},
{q:"The results ___ next Friday.",opts:["will announce","will be announced","are announced","announce"],a:1,why:"Будущее в пассиве: will be + V3."},
{q:"Впиши глагол: The room ___ (clean) every morning.",accepted:["is cleaned"],why:"Регулярное действие → Present Simple Passive: is cleaned."},
{q:"Впиши глагол: My phone ___ (steal) last weekend.",accepted:["was stolen"],why:"Past Simple Passive: was stolen."},
{q:"Choose the correct sentence:",opts:["The dinner is cooking by my dad.","The dinner is being cooked by my dad.","The dinner is been cooked by my dad.","The dinner cooks by my dad."],a:1,why:"Процесс прямо сейчас → Present Continuous Passive: is being cooked."},
{q:"The new library ___ already ___ .",opts:["has / been opened","have / been opened","has / opened","was / opening"],a:0,why:"Результат к настоящему → Present Perfect Passive: has been opened."},
{q:"Впиши глагол: These cakes ___ (make) by my grandmother.",accepted:["are made","were made"],why:"are made (обычно) или were made (тогда) - оба принимаются."},
{q:"Choose the correct sentence:",opts:["I was gave a present.","I was given a present.","I gave was a present.","I was give a present."],a:1,why:"Пассив: was given (give-gave-given)."}]},

{id:"g-modals",title:"Модальные глаголы",blurb:"can, must, have to, should, might",
theory:[
"<b>can/could</b> - умение, возможность, просьба. <b>should</b> - совет (<i>You should sleep more</i>).",
"<b>must</b> - внутренняя обязанность или уверенный вывод (<i>You must be tired</i>). <b>have to</b> - внешняя необходимость (правило, закон).",
"<b>mustn't</b> - запрещено. <b>don't have to</b> - можно не делать. Это разные вещи!",
"<b>may/might</b> - вероятность (<i>It might rain</i>). После модальных - голый инфинитив без to (кроме have to, ought to)."],
ex:[
{q:"You ___ wear a helmet - it's the law.",opts:["should","have to","might","could"],a:1,why:"Внешнее правило/закон → have to."},
{q:"You look exhausted. You ___ go to bed earlier.",opts:["must","should","can","may"],a:1,why:"Совет → should."},
{q:"You ___ pay for the museum - it's free today.",opts:["mustn't","don't have to","can't","shouldn't"],a:1,why:"«Можно не платить» → don't have to. mustn't = запрещено."},
{q:"It ___ rain later - take an umbrella just in case.",opts:["must","might","has to","should"],a:1,why:"Неуверенная вероятность → might."},
{q:"Впиши модальный глагол: You ___ smoke here - it's strictly forbidden.",accepted:["mustn't","must not","can't","cannot"],why:"Запрет → mustn't / can't."},
{q:"She speaks four languages - she ___ be very talented.",opts:["can","must","should","might not"],a:1,why:"Уверенный логический вывод → must be."},
{q:"Choose the correct sentence:",opts:["He can to swim very well.","He cans swim very well.","He can swim very well.","He can swims very well."],a:2,why:"После can - голый инфинитив: can swim."},
{q:"When I was five, I ___ already read.",opts:["can","could","must","should"],a:1,why:"Умение в прошлом → could."},
{q:"Впиши модальный глагол: ___ I borrow your pen, please?",accepted:["could","can","may"],why:"Вежливая просьба: Could/May/Can I...?"}]},

{id:"g-relative",title:"Относительные предложения",blurb:"who, which, that, whose, where",
theory:[
"<b>who</b> - о людях, <b>which</b> - о вещах, <b>that</b> - о тех и других (в defining clauses), <b>whose</b> - чей, <b>where</b> - о месте.",
"<i>The girl who won... The app which/that I use... The writer whose book... The café where we met.</i>",
"Если местоимение - дополнение, его можно опустить: <i>The film (that) we watched was great.</i> Нельзя опустить, если оно - подлежащее: <i>The film that won the prize...</i>",
"После запятой (non-defining) that не используется: <i>My brother, who lives in Moscow, ...</i>"],
ex:[
{q:"The woman ___ lives next door is a pilot.",opts:["which","who","whose","where"],a:1,why:"О человеке, подлежащее → who."},
{q:"This is the café ___ we first met.",opts:["which","that","where","who"],a:2,why:"О месте (в котором) → where."},
{q:"He's the student ___ project won the competition.",opts:["who","which","whose","that"],a:2,why:"Принадлежность (чей проект) → whose."},
{q:"The phone ___ I bought last month has already broken.",opts:["who","which","whose","where"],a:1,why:"О вещи → which (или that, или опустить)."},
{q:"In which sentence can the relative pronoun be left out?",opts:["The man who called you is here.","The book that changed my life is short.","The song that she wrote became famous.","The dog that bit me ran away."],a:2,why:"В 'The song (that) she wrote' местоимение - дополнение (she wrote it), можно опустить."},
{q:"Впиши слово: My grandmother, ___ is 80, still works in her garden.",accepted:["who"],why:"Non-defining clause о человеке → who (that после запятой нельзя)."},
{q:"Choose the correct sentence:",opts:["My city, that is quite small, is very green.","My city, which is quite small, is very green.","My city which is quite small is very green.","My city, where is quite small, is very green."],a:1,why:"Non-defining (с запятыми) о вещи → which."},
{q:"Everything ___ he said turned out to be true.",opts:["what","that","which","who"],a:1,why:"После everything/all/nothing → that (не what)."},
{q:"Впиши слово: The hotel ___ we stayed was right on the beach.",accepted:["where"],why:"Место (в котором мы жили) → where. Вариант: at which."}]}
];
