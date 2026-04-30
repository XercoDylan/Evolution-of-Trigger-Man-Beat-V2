export const cityCoords = {
    "New York":    [-74.006,  40.7128],
    "New Orleans": [-90.0715, 29.9511],
    "Baton Rouge": [-91.1403, 30.4515],
    "Memphis":     [-90.0490, 35.1495],
    "Houston":     [-95.3698, 29.7604],
}

export const nodeOffsets = {
    "Drag Rap":             [   0,    0],
    "Back That Azz Up":     [   0,  -85],
    "Where Dey At":         [  65,    -50],
    "Clap For Em":          [   0,   0],
    "Explode":              [ -65,    0],
    "Wipe Me Down":         [-130,  -90],
    "Whatchu Kno 'Bout Me": [-130,    0],
    "Gangsta Walk":         [   0,    0],
    "Break My Soul":        [   -20,    0],
}

export const data = {
    "Drag Rap": {
        children: ["Wipe Me Down", "Back That Azz Up", "Where Dey At", "Gangsta Walk", "Explode"],
        image: "https://images.genius.com/24cabdbec471fa5395717ed9c79d3e9a.499x506x1.jpg",
        time: 1, year: 1986,
        artist: "The Showboys",
        city: "New York",
        audio: "Drag Rap Cut.m4a",
        description: "This track serves as the starting point for this genre. Two teenagers from Queens make this song as a parody of the 1950s police drama Dragnet. The song flopped in New York but migrated South on cassette tapes, where it became the foundation of an entire genre. Listen for the TR-808 drums, the xylophone, and the looped synth riff. These are the stems that will be chopped and looped for the subsequent four decades."
    },
    "Wipe Me Down": {
        children: ["Whatchu Kno 'Bout Me"],
        image: "https://i.discogs.com/8XaEVETtOiyRcptgkkAL_DrhpNigfmRvaeiCRHluZjI/rs:fit/g:sm/q:90/h:600/w:578/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9SLTIxMTMz/OTctMTM5NDkzNTAy/NS04NTQwLmpwZWc.jpeg",
        time: 22, year: 2007,
        artist: "Foxx, Boosie Badazz & Webbie",
        city: "Baton Rouge",
        audio: "Wipe Me Down Cut.m4a",
        description: "This mid-2000s Louisiana staple demonstrates the beat's influence bleeding out of New Orleans into neighboring Baton Rouge. It bridges the gap between high-BPM club bounce and the modern, heavier Southern trap sound. A frequent inclusion in many club sets and playlists to this day, \"Wipe Me Down\" is a pivotal track that has shaped the sound of music nationwide. Listen for the call-and-response of the Bounce Sound, and the \"Drag Rap\" sample in the drum fill before each section change."
    },
    "Whatchu Kno 'Bout Me": {
        children: [],
        image: "https://i1.sndcdn.com/artworks-tNEZOPArDhPC4PWH-Zbn65Q-t500x500.png",
        time: 39, year: 2024,
        artist: "Glorilla ft Sexyy Red",
        city: "Baton Rouge",
        audio: "Whatchu Kno About Me Cut.m4a",
        description: "This track demonstrates the multi-generational game of telephone that is sampling. This modern crunk anthem directly samples Boosie's \"Wipe Me Down,\" recycling the Baton Rouge interpretation of the Bounce rhythm for an entirely new generation. Listen for the bassline and synth from Wipe Me Down and the chant style delivery almost 40 years after Drag Rap was created."
    },
    "Back That Azz Up": {
        children: ["Clap For Em"],
        image: "https://i.scdn.co/image/ab67616d0000b273683fee123a35b36d53f21a58",
        time: 14, year: 1999,
        artist: "Juvenile",
        city: "New Orleans",
        audio: "Back That Azz Up Cut.m4a",
        description: "\"Back That Azz Up\" is a track often credited for bringing New Orleans bounce into the national consciousness. Upon release in 1999, this song became inescapable in the club for much of the next decade, and is included played in many DJ sets to this day. The Triggerman sample can be heard in the hollow bell sound that plays every measure, and you can hear the characteristic call and response of the Bounce genre in the chorus."
    },
    "Where Dey At": {
        children: ["Clap For Em"],
        image: "https://f4.bcbits.com/img/a1678121897_16.jpg",
        time: 6, year: 1991,
        artist: "MC T Tucker & DJ Irv",
        city: "New Orleans",
        audio: "Where Dey At Cut.m4a",
        description: "Widely considered the first New Orleans Bounce track, this song marks the moment Triggerman becomes a distinct musical movement. At parties, DJ Irv would isolate and loop the Triggerman drums on repeat while MC T Tucker delivered call and response chants over the top. Listen for the live turntablism and the shift toward higher energy, dance oriented music."
    },
    "Clap For Em": {
        children: [],
        image: "https://i1.sndcdn.com/artworks-V6bgWPcfWWhg-0-t500x500.jpg",
        time: 35, year: 2020,
        artist: "Lil Wayne",
        city: "New Orleans",
        audio: "Clap For Em Cut.m4a",
        description: "A victory lap for Bounce, \"Clap For Em\" is New Orleans artist Lil' Wayne's homage to the genre's biggest hits. This song directly samples not only \"Drag Rap\", but also directly samples \"Where Dey At\" and \"Back That Azz Up\" to pay respects to the lineage of the genre. The intro of \"Shake that ass like a salt shaker\" is lifted directly from the track \"Where Dey At\", largely considered the first Nola Bounce song, which then transitions immediately into the xylophone of the drag rap sample."
    },
    "Gangsta Walk": {
        children: [],
        image: "https://upload.wikimedia.org/wikipedia/en/4/4d/Coolio_-_Gangsta_Walk.jpg",
        time: 3, year: 1988,
        artist: "DJ Spanish Fly",
        city: "Memphis",
        audio: "Gangsta Walk Cut.m4a",
        description: "This is the crucial geographic bridge in our history, representing the earliest known example of \"Drag Rap\" taking root in the south. In the late 80s, DJ Spanish Fly adopted \"Drag Rap\", including the instrumental on his mixtapes and sampling it on a few of his songs. Soon, the so called Triggerman beat was the soundtrack to Memphis' signature gangster walk dance move. As you listen, notice the tempo shift. The crisp original instrumental is pitched down and made into something more muddy and hypnotic."
    },
    "Explode": {
        children: ["Break My Soul"],
        image: "https://i.scdn.co/image/ab67616d0000b2736d6e3b5e9c2f50e1b1fef88c",
        time: 29, year: 2014,
        artist: "Big Freedia",
        city: "New Orleans",
        audio: "Explode Cut.m4a",
        description: "Coming out of the hypermasculinity of the Bounce genre in the late 90s/early 2000s, Big Freedia revolutionized the genre by bringing elements of queerness and femininity into its mainstream. After Hurricane Katrina in 2005, Big Freedia and other artists brought the sound of Bounce to Houston, where it influenced the music of artists like Beyoncé. Listen for all of the characteristics of modern bounce tracks, such as the use of call-and-response and choppy vocal loops."
    },
    "Break My Soul": {
        children: [],
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT0QZZ4lPRHmQOkKtF1uCIXfmctITc7xWo-dQ&s",
        time: 37, year: 2022,
        artist: "Beyoncé",
        city: "Houston",
        audio: "Break My Soul Cut.m4a",
        description: "Though not a bounce track, Beyoncé's \"Break My Soul\" is a prime example of how the New Orleans Bounce genre has influenced the sound of music across the country. Bounce was introduced to Houston after Hurricane Katrina in 2005, and the genre has heavily shaped the sound of Beyoncé's music. By directly sampling Big Freedia's \"Explode\", Beyoncé uses this track to highlight the importance of black queerness in club music."
    },
}
