#!/usr/bin/env python3
"""Third batch: duplicates/typos, plus well-known authors missed in first two passes."""

import psycopg2

DB = {
    'host': 'db.xhhvbxjllictpxtebeur.supabase.co',
    'dbname': 'postgres',
    'user': 'postgres',
    'password': 'hzwij3$9Tzy%Oq7Y',
    'port': 5432,
}

WARFIELD_BIO = (
    'Benjamin Breckinridge Warfield (1851–1921) was the last of the great Princeton theologians, '
    'serving as professor of didactic and polemic theology at Princeton Seminary for thirty-four '
    'years. A towering defender of Reformed orthodoxy and biblical inerrancy, his collected works '
    'span Christology, soteriology, apologetics, and the history of doctrine.'
)

PINK_BIO = (
    'Arthur W. Pink (1886–1952) was a British-born Reformed author and Bible teacher whose '
    'writings have enjoyed a wide and lasting readership. His works — including The Sovereignty '
    'of God, The Attributes of God, and Studies in the Scriptures — are marked by careful '
    'exposition, doctrinal rigor, and an earnest call to holy living.'
)

DABNEY_BIO = (
    'Robert Lewis Dabney (1820–1898) was a Southern Presbyterian theologian, professor at Union '
    'Theological Seminary in Virginia, and chief of staff to Stonewall Jackson during the Civil War. '
    'His Systematic Theology and Lectures in Systematic Theology remain thorough expositions of '
    'Reformed Calvinist doctrine from the Southern Presbyterian tradition.'
)

MCHEYNE_BIO = (
    'Robert Murray McCheyne (1813–1843) was a Church of Scotland minister at St. Peter\'s, '
    'Dundee, whose brief life and fervent piety made him one of the most celebrated figures '
    'in Scottish church history. Andrew Bonar\'s Memoir and Remains of McCheyne, along with '
    'his letters and sermons, continue to move readers with their portrait of consecrated '
    'pastoral ministry.'
)

ENGELSMA_BIO = (
    'David J. Engelsma (b. 1939) is a Protestant Reformed theologian who pastored Protestant '
    'Reformed Churches before serving as professor of Dogmatics and Old Testament at the Protestant '
    'Reformed Theological Seminary in Grand Rapids. A prolific contributor to The Standard Bearer, '
    'he has written on marriage, covenant theology, amillennialism, and the distinctive doctrines '
    'of the Protestant Reformed tradition.'
)

HOEKSEMA_BIO = (
    'Herman Hoeksema (1886–1965) was a Dutch-born Reformed theologian and pastor who emigrated '
    'to the United States and co-founded the Protestant Reformed Churches in 1924. He served as '
    'professor of theology at the Protestant Reformed Seminary for forty years and authored '
    'Reformed Dogmatics, the most extensive systematic theology produced within the Protestant '
    'Reformed tradition.'
)

BIOS = {
    # Typo duplicates — copy canonical bios
    'benjiman-b-warfield':  WARFIELD_BIO,
    'benjamine-b-warfield': WARFIELD_BIO,
    'aw-pink':              PINK_BIO,
    'author-w-pink':        PINK_BIO,
    'rl-dabney':            DABNEY_BIO,
    'robert-murray-mcheyne-2': MCHEYNE_BIO,
    'prof-david-engelsma':  ENGELSMA_BIO,
    'rev-herman-hoeksema':  HOEKSEMA_BIO,

    # Well-known figures missed in earlier batches
    'albert-dod': (
        'Albert Baldwin Dod (1805–1845) was a professor of mathematics at Princeton College and '
        'a lay theologian closely associated with the Princeton Seminary tradition. A brilliant and '
        'versatile scholar, he contributed important apologetic articles to the Biblical Repertory '
        'and Princeton Review defending Calvinism and the Westminster standards.'
    ),
    'hugh-martin': (
        'Hugh Martin (1822–1885) was a Scottish Free Church minister who served at Panbride and '
        'later devoted himself entirely to theological writing. His major works — The Atonement '
        'and The Prophet Jonah — are esteemed in Reformed circles for their profound treatment of '
        'substitutionary atonement and their deep spiritual insight.'
    ),
    'samuel-pike': (
        'Samuel Pike (1717–1773) was an English Congregationalist minister and Calvinist theologian '
        'who pastored at St. Martin\'s-le-Grand in London. He is best known for his Persuasive to '
        'a Holy Life and his Familiar Introduction to the Holy Scriptures, works marked by clear '
        'Calvinistic piety and practical application.'
    ),
    'john-brown': (
        'John Brown of Haddington (1722–1787) was a Scottish minister, self-taught biblical scholar, '
        'and Professor of Divinity for the Secession Church. His Self-Interpreting Bible, Dictionary '
        'of the Holy Bible, and commentary on the New Testament made him one of the most widely read '
        'Scottish theological writers of the eighteenth century.'
    ),
    'albert-martin': (
        'Albert N. Martin is a Reformed Baptist pastor who served Trinity Baptist Church in '
        'Montville, New Jersey, for over forty years and is known for his expository preaching '
        'and his extensive lectures on preaching and pastoral ministry. His multi-volume work '
        'on preaching is widely used in Reformed Baptist ministerial training.'
    ),
    'albert-n-martin': (
        'Albert N. Martin is a Reformed Baptist pastor who served Trinity Baptist Church in '
        'Montville, New Jersey, for over forty years and is known for his expository preaching '
        'and his extensive lectures on preaching and pastoral ministry. His multi-volume work '
        'on preaching is widely used in Reformed Baptist ministerial training.'
    ),
    'tom-nettles': (
        'Tom Nettles is a Baptist church historian and professor emeritus of historical theology '
        'at the Southern Baptist Theological Seminary who taught at Southwestern and Trinity '
        'Evangelical Divinity School before moving to Louisville. His three-volume By His Grace '
        'and For His Glory is the definitive study of Calvinism in Southern Baptist history.'
    ),
    'thomas-j-nettles': (
        'Thomas J. Nettles is a Baptist church historian and professor emeritus of historical '
        'theology at the Southern Baptist Theological Seminary. His three-volume By His Grace '
        'and For His Glory is the definitive study of Calvinism in Southern Baptist history, '
        'and he has written major biographies of James Petigru Boyce and B. H. Carroll.'
    ),
    'donald-macleod': (
        'Donald Macleod (b. 1940) is a Free Church of Scotland minister and emeritus professor '
        'of systematic theology at the Free Church College in Edinburgh. He is one of the most '
        'respected contemporary Scottish Reformed theologians, known for clear and forthright '
        'writing on Christology, the atonement, and the person of the Holy Spirit.'
    ),
    'ot-allis': (
        'Oswald T. Allis (1880–1973) was an Old Testament scholar who taught at Princeton '
        'Theological Seminary and Westminster Theological Seminary, and was a founding faculty '
        'member at Westminster. His Prophecy and the Church (1945) is a standard Reformed critique '
        'of dispensationalism, and The Five Books of Moses defends the Mosaic authorship of the Pentateuch.'
    ),
    'r-a-torrey': (
        'R. A. Torrey (1856–1928) was an American evangelist, pastor, and educator who served as '
        'superintendent of the Moody Bible Institute, first dean of the Bible Institute of Los '
        'Angeles (now Biola University), and as a co-editor of The Fundamentals. Though Arminian '
        'in his soteriology, his writings on the Holy Spirit, prayer, and personal evangelism '
        'have been widely read in Reformed circles.'
    ),
    'wgt-shedd': (
        'W. G. T. Shedd (1820–1894) was an American Reformed theologian who taught at Andover, '
        'Auburn, and Union Theological Seminary in New York, where he held the chair of Systematic '
        'Theology for many years. His three-volume Dogmatic Theology is a rigorous defense of '
        'Calvinist orthodoxy drawing on Augustine, Calvin, and the Westminster standards.'
    ),
    'richard-j-bauckham': (
        'Richard J. Bauckham (b. 1946) is a British New Testament scholar and historical theologian '
        'who taught at the University of St Andrews and is an emeritus professor at Cambridge. His '
        'Jesus and the Eyewitnesses is regarded as a landmark contribution to historical Jesus '
        'scholarship, and his work on biblical theology and the Book of Revelation is widely '
        'influential across Reformed and evangelical circles.'
    ),
    'william-cowper': (
        'William Cowper (1731–1800) was an English poet and hymnist whose collaboration with '
        'John Newton produced the Olney Hymns (1779), including "God Moves in a Mysterious Way" '
        'and "O for a Closer Walk with God." A deeply Calvinist Christian, his poetry and '
        'correspondence reveal a man of profound piety who struggled throughout his life with '
        'depression and spiritual anxiety.'
    ),
    'david-f-wells': (
        'David F. Wells (b. 1939) is a South African-born Reformed theologian who taught systematic '
        'theology at Gordon-Conwell Theological Seminary for over thirty years. His four-volume '
        'series beginning with No Place for Truth (1993) offers a searching critique of evangelical '
        'accommodation to modernity and a call to recover confessional Reformed theology.'
    ),
    'edmund-p-clowney': (
        'Edmund P. Clowney (1917–2005) was a Reformed theologian and the first president of '
        'Westminster Theological Seminary, where he also taught homiletics and practical theology. '
        'A pioneer of Christ-centered biblical preaching, his book The Unfolding Mystery and his '
        'teaching on preaching Christ from the Old Testament have shaped generations of Reformed pastors.'
    ),
    'j-wilbur-chapman': (
        'J. Wilbur Chapman (1859–1918) was an American Presbyterian evangelist and pastor who '
        'worked closely with Dwight L. Moody and later conducted his own evangelistic campaigns '
        'worldwide. He played a key role in mentoring Billy Sunday and served as director of the '
        'Winona Lake Bible Conference in Indiana.'
    ),
    'dr-w-robert-godfrey': (
        'W. Robert Godfrey (b. 1945) is a church historian and Reformed theologian who served '
        'as president of Westminster Seminary California from 1991 to 2019 and is a teaching '
        'fellow of Ligonier Ministries. He is widely known for his scholarship on the Reformation, '
        'Reformed worship, and the Heidelberg Catechism.'
    ),
    'robert-godfrey': (
        'W. Robert Godfrey (b. 1945) is a church historian and Reformed theologian who served '
        'as president of Westminster Seminary California from 1991 to 2019 and is a teaching '
        'fellow of Ligonier Ministries. He is widely known for his scholarship on the Reformation, '
        'Reformed worship, and the Heidelberg Catechism.'
    ),
    'j-h-merle-daubigné': (
        'J. H. Merle d\'Aubigné (1794–1872) was a Swiss Reformed church historian and theologian '
        'who taught at the Evangelical Society of Geneva. His multi-volume History of the '
        'Reformation of the Sixteenth Century was a bestseller in both Europe and America and '
        'remains one of the most vivid and widely read popular accounts of the Protestant Reformation.'
    ),
    'jh-merle-daubigne': (
        'J. H. Merle d\'Aubigné (1794–1872) was a Swiss Reformed church historian and theologian '
        'who taught at the Evangelical Society of Geneva. His multi-volume History of the '
        'Reformation of the Sixteenth Century was a bestseller in both Europe and America and '
        'remains one of the most vivid and widely read popular accounts of the Protestant Reformation.'
    ),
    'john-geree': (
        'John Geree (1601–1649) was an English Puritan minister and writer who served in '
        'Tewkesbury and London. He is best known for his 1646 tract The Character of an Old '
        'English Puritane, a classic description of Puritan piety that remains a frequently '
        'quoted portrait of the Puritan ideal.'
    ),
    'john-hooper': (
        'John Hooper (c. 1495–1555) was an English Protestant reformer and Bishop of Gloucester '
        'and Worcester who was burned at the stake during the Marian persecutions, becoming one '
        'of the most prominent Protestant martyrs of the Reformation era. A strongly Reformed '
        'theologian, he resisted clerical vestments on conscientious grounds and his martyrdom '
        'made him a hero of subsequent Puritan and nonconformist tradition.'
    ),
    'gilbert-beebe': (
        'Gilbert Beebe (1800–1881) was an American Primitive Baptist minister and editor who '
        'founded and edited The Signs of the Times newspaper for nearly fifty years, making it '
        'the most influential periodical in the Primitive Baptist movement. A thoroughgoing '
        'Calvinist, he defended particular redemption and absolute predestination against '
        'all forms of Arminianism and "missionary" Baptist practice.'
    ),
    'gary-demar': (
        'Gary DeMar is an American Reformed author and lecturer who served as president of '
        'American Vision for many years. A proponent of postmillennialism and biblical worldview '
        'thinking, he has written extensively on eschatology, politics, and the application '
        'of Scripture to culture, including Last Days Madness, a critique of modern prophetic '
        'speculation.'
    ),
    'fred-g-zaspel': (
        'Fred G. Zaspel is a Reformed Baptist pastor and theologian who serves Cornerstone Baptist '
        'Church in Franconia, Pennsylvania, and is a founding editor of Books at a Glance. He '
        'holds a PhD from the Free University of Amsterdam and is best known for The Theology of '
        'B.B. Warfield, the definitive study of Warfield\'s theological thought.'
    ),
    'peter-toon': (
        'Peter Toon (1939–2009) was an English Anglican minister, theologian, and prolific author '
        'who held positions at Oak Hill College in London and later in the United States. He wrote '
        'extensively on Puritan theology, the history of doctrine, and Anglican liturgy, and was '
        'a tireless advocate for confessional Anglican orthodoxy.'
    ),
    'kenneth-macrae': (
        'Kenneth A. MacRae (1883–1964) was a Free Church of Scotland minister who served in '
        'Stornoway, Lewis, for many decades and was one of the most respected Highland ministers '
        'of his generation. His published diary and sermons, along with his principled stands on '
        'issues of church and state, have made him a significant figure in twentieth-century '
        'Scottish church history.'
    ),
    'herman-c-hanko': (
        'Herman C. Hanko (b. 1930) is a Protestant Reformed theologian and minister who taught '
        'church history and New Testament at the Protestant Reformed Theological Seminary in '
        'Grand Rapids for many decades. He has written extensively on covenant theology, church '
        'history, and Protestant Reformed distinctive doctrines.'
    ),
    'samual-e-waldron': (
        'Samuel E. Waldron is a Reformed Baptist pastor and theologian who co-founded Reformed '
        'Baptist Seminary (now Covenant Baptist Theological Seminary) and has served as its '
        'president. He has written extensively on Baptist confessionalism, systematic theology, '
        'and eschatology, and is known as a clear expositor of the 1689 London Baptist Confession.'
    ),
    'william-twisse': (
        'William Twisse (1578–1646) was a Calvinist theologian and the first moderator of the '
        'Westminster Assembly. A fierce defender of supralapsarianism and the doctrines of grace, '
        'he engaged in polemical exchanges with Arminius\'s followers and was one of the most '
        'rigorous scholastic Calvinist theologians of his era.'
    ),
    'george-offor': (
        'George Offor (1787–1864) was an English antiquarian and Baptist bookseller best known '
        'for his monumental three-volume edition of the complete works of John Bunyan (1862), '
        'which remained the standard scholarly edition for over a century. His extensive '
        'bibliographical notes made previously rare Bunyan works accessible to a wide readership.'
    ),
    'iain-murray': (
        'Iain H. Murray is a Scottish minister and co-founder of the Banner of Truth Trust, '
        'which has republished Puritan and Reformed works since 1957. As a biographer of '
        'Spurgeon, Lloyd-Jones, Jonathan Edwards, and others, Murray has done more than almost '
        'anyone to recover the history and writings of the Reformed tradition for modern readers.'
    ),
}


def run():
    conn = psycopg2.connect(**DB)
    conn.autocommit = False
    cur = conn.cursor()

    updated = 0
    not_found = 0

    for slug, bio in BIOS.items():
        cur.execute(
            "UPDATE authors SET bio = %s WHERE slug = %s AND (bio IS NULL OR bio = '')",
            (bio, slug)
        )
        if cur.rowcount > 0:
            updated += 1
            print(f"  ✓ {slug}")
        else:
            cur.execute("SELECT id FROM authors WHERE slug = %s", (slug,))
            if not cur.fetchone():
                not_found += 1
                print(f"  ! NOT FOUND: {slug}")

    conn.commit()
    cur.close()
    conn.close()

    conn2 = psycopg2.connect(**DB)
    cur2 = conn2.cursor()
    cur2.execute("SELECT count(*) FROM authors WHERE bio IS NOT NULL AND bio != ''")
    with_bio = cur2.fetchone()[0]
    cur2.execute("SELECT count(*) FROM authors")
    total = cur2.fetchone()[0]
    cur2.close()
    conn2.close()

    print(f"\n✓ Done. Updated {updated} (not found: {not_found}).")
    print(f"  Total coverage: {with_bio}/{total} authors now have bios.")


if __name__ == '__main__':
    run()
