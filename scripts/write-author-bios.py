#!/usr/bin/env python3
"""
Write author bios to the authors table for all well-known Reformed/Puritan figures.
Bios are 2-3 sentences — enough for an "About the Author" card.
Skips duplicates and obscure modern authors (to be handled separately).
"""

import psycopg2

DB = {
    'host': 'db.xhhvbxjllictpxtebeur.supabase.co',
    'dbname': 'postgres',
    'user': 'postgres',
    'password': 'hzwij3$9Tzy%Oq7Y',
    'port': 5432,
}

BIOS = {
    # slug: bio
    'loraine-boettner': (
        'Loraine Boettner (1901–1990) was one of the twentieth century\'s most prolific '
        'Reformed theologians. His magnum opus, The Reformed Doctrine of Predestination (1932), '
        'remains a definitive popular-level defense of Calvinism, and his writings on Roman '
        'Catholicism, the millennium, and immortality have shaped generations of Reformed readers.'
    ),
    'arthur-w-pink': (
        'Arthur W. Pink (1886–1952) was a British-born Reformed author and Bible teacher whose '
        'writings have enjoyed a wide and lasting readership. His works — including The Sovereignty '
        'of God, The Attributes of God, and Studies in the Scriptures — are marked by careful '
        'exposition, doctrinal rigor, and an earnest call to holy living.'
    ),
    'arthur-pink': (
        'Arthur W. Pink (1886–1952) was a British-born Reformed author and Bible teacher whose '
        'writings have enjoyed a wide and lasting readership. His works — including The Sovereignty '
        'of God, The Attributes of God, and Studies in the Scriptures — are marked by careful '
        'exposition, doctrinal rigor, and an earnest call to holy living.'
    ),
    'jonathan-edwards': (
        'Jonathan Edwards (1703–1758) was America\'s greatest theologian-philosopher and a central '
        'figure of the Great Awakening. Pastor of Northampton, Massachusetts for over twenty years, '
        'he produced enduring works on revival, religious affections, the freedom of the will, and '
        'the nature of true virtue — writings that continue to shape Reformed theology worldwide.'
    ),
    'benjamin-b-warfield': (
        'Benjamin Breckinridge Warfield (1851–1921) was the last of the great Princeton theologians, '
        'serving as professor of didactic and polemic theology at Princeton Seminary for thirty-four '
        'years. A towering defender of Reformed orthodoxy and biblical inerrancy, his collected works '
        'span Christology, soteriology, apologetics, and the history of doctrine.'
    ),
    'john-murray': (
        'John Murray (1898–1975) was a Scottish-born theologian who taught at Westminster Theological '
        'Seminary from 1930 to 1966. His systematic exposition of Reformed doctrine — especially his '
        'commentary on Romans and his study Redemption Accomplished and Applied — are considered '
        'modern classics of Reformed scholarship.'
    ),
    'archibald-alexander': (
        'Archibald Alexander (1772–1851) was the founding professor of Princeton Theological Seminary '
        'and one of the most influential figures in early American Presbyterianism. Shaped by the '
        'revivals of the late eighteenth century, he combined warm evangelical piety with rigorous '
        'Calvinist orthodoxy in his teaching and writing.'
    ),
    'charles-hodge': (
        'Charles Hodge (1797–1878) taught at Princeton Theological Seminary for fifty-eight years '
        'and is widely regarded as the foremost American Reformed theologian of the nineteenth century. '
        'His three-volume Systematic Theology is a landmark of Princeton theology, and his commentaries '
        'on Romans, Ephesians, and the Corinthian epistles remain valuable today.'
    ),
    'j-gresham-machen': (
        'J. Gresham Machen (1881–1937) was a Princeton New Testament scholar who became the leading '
        'defender of confessional Presbyterianism against theological liberalism. His book Christianity '
        'and Liberalism (1923) argued that liberalism was not a form of Christianity but a different '
        'religion entirely, and he went on to found Westminster Theological Seminary and the Orthodox '
        'Presbyterian Church.'
    ),
    'john-owen': (
        'John Owen (1616–1683) was the greatest English Puritan theologian, renowned for the depth '
        'and comprehensiveness of his theological writings. As Vice-Chancellor of Oxford, chaplain to '
        'Oliver Cromwell, and pastor of independent congregations, he produced definitive works on the '
        'Holy Spirit, the atonement, apostasy, and the Epistle to the Hebrews.'
    ),
    'r-l-dabney': (
        'Robert Lewis Dabney (1820–1898) was a Southern Presbyterian theologian, professor at Union '
        'Theological Seminary in Virginia, and chief of staff to Stonewall Jackson during the Civil War. '
        'His Systematic Theology and Lectures in Systematic Theology remain thorough expositions of '
        'Reformed Calvinist doctrine from the Southern Presbyterian tradition.'
    ),
    'dr-greg-bahnsen': (
        'Greg Bahnsen (1948–1995) was a Reformed philosopher and apologist who studied under Cornelius '
        'Van Til and became the foremost exponent of presuppositional apologetics. His work Always Ready '
        'and his famous debate with atheist Gordon Stein helped popularize Van Tillian apologetics for '
        'a new generation.'
    ),
    'greg-bahnsen': (
        'Greg Bahnsen (1948–1995) was a Reformed philosopher and apologist who studied under Cornelius '
        'Van Til and became the foremost exponent of presuppositional apologetics. His work Always Ready '
        'and his famous debate with atheist Gordon Stein helped popularize Van Tillian apologetics for '
        'a new generation.'
    ),
    'john-flavel': (
        'John Flavel (c. 1628–1691) was an English Puritan minister at Dartmouth whose practical and '
        'devotional writings earned him lasting admiration. His works — especially The Mystery of '
        'Providence, Keeping the Heart, and Christ Knocking at the Door of Sinners\' Hearts — '
        'are celebrated for their warm application of Reformed doctrine to the Christian life.'
    ),
    'jc-ryle': (
        'J. C. Ryle (1816–1900) was the first Bishop of Liverpool and one of the most readable '
        'evangelical Anglican writers of the Victorian era. His Expository Thoughts on the Gospels, '
        'Holiness, and Practical Religion combine clear doctrinal instruction with direct, plain-spoken '
        'application that continues to reach readers across denominational lines.'
    ),
    'j-c-ryle': (
        'J. C. Ryle (1816–1900) was the first Bishop of Liverpool and one of the most readable '
        'evangelical Anglican writers of the Victorian era. His Expository Thoughts on the Gospels, '
        'Holiness, and Practical Religion combine clear doctrinal instruction with direct, plain-spoken '
        'application that continues to reach readers across denominational lines.'
    ),
    'michael-s-horton': (
        'Michael Horton is the J. Gresham Machen Professor of Systematic Theology and Apologetics at '
        'Westminster Seminary California and a co-founder of the White Horse Inn radio broadcast. '
        'His books — including The Christian Faith, Covenant and Salvation, and Ordinary — '
        'defend two-kingdoms theology, Word-and-sacrament ecclesiology, and classic Reformed confessionalism.'
    ),
    'thomas-boston': (
        'Thomas Boston (1676–1732) was a Scottish minister at Ettrick whose pastoral warmth and '
        'theological depth made him one of the most beloved figures in Scottish church history. '
        'His Human Nature in Its Fourfold State remains a devotional and doctrinal classic, and '
        'his role in the "Marrow Controversy" placed him at the center of debates over free grace '
        'in the Scottish church.'
    ),
    'charles-h-spurgeon': (
        'Charles Haddon Spurgeon (1834–1892) was the most celebrated English preacher of the '
        'nineteenth century, drawing congregations of thousands to the Metropolitan Tabernacle in '
        'London. A warm-hearted Calvinist, he preached over 3,500 sermons, wrote prolifically, '
        'founded Spurgeon\'s College, and became known worldwide as the "Prince of Preachers."'
    ),
    'charles-spurgeon': (
        'Charles Haddon Spurgeon (1834–1892) was the most celebrated English preacher of the '
        'nineteenth century, drawing congregations of thousands to the Metropolitan Tabernacle in '
        'London. A warm-hearted Calvinist, he preached over 3,500 sermons, wrote prolifically, '
        'founded Spurgeon\'s College, and became known worldwide as the "Prince of Preachers."'
    ),
    'a-a-hodge': (
        'A. A. Hodge (1823–1886) was the son of Charles Hodge and his successor as professor of '
        'systematic theology at Princeton Theological Seminary. His Outlines of Theology provided '
        'a more accessible summary of Princeton Calvinism, and his collaboration with B. B. Warfield '
        'on biblical inerrancy helped define the conservative Reformed position for decades.'
    ),
    'aa-hodge': (
        'A. A. Hodge (1823–1886) was the son of Charles Hodge and his successor as professor of '
        'systematic theology at Princeton Theological Seminary. His Outlines of Theology provided '
        'a more accessible summary of Princeton Calvinism, and his collaboration with B. B. Warfield '
        'on biblical inerrancy helped define the conservative Reformed position for decades.'
    ),
    'george-whitefield': (
        'George Whitefield (1714–1770) was the foremost evangelist of the eighteenth-century '
        'Great Awakening, preaching to massive outdoor crowds across England and the American '
        'colonies. A close associate of John Wesley before their break over Calvinism, Whitefield '
        'became a convinced Calvinist whose fiery, extemporaneous preaching was instrumental '
        'in awakening multitudes on both sides of the Atlantic.'
    ),
    'john-calvin': (
        'John Calvin (1509–1564) was the foremost second-generation Reformer, whose Institutes of '
        'the Christian Religion became the defining systematic theology of the Reformed tradition. '
        'As pastor and teacher in Geneva, he produced an enormous body of biblical commentaries, '
        'sermons, and treatises that shaped Protestantism throughout Europe and across the centuries.'
    ),
    'john-h-gerstner': (
        'John H. Gerstner (1914–1996) was a Reformed theologian and church historian who taught at '
        'Pittsburgh Theological Seminary for many years. A devoted student of Jonathan Edwards and '
        'a mentor to R. C. Sproul, he wrote widely on Reformed theology, apologetics, and the '
        'history of Calvinist thought in America.'
    ),
    'john-newton': (
        'John Newton (1725–1807) was an English clergyman and hymn-writer best known as the author '
        'of "Amazing Grace." A former slave-ship captain who experienced a dramatic conversion, he '
        'became a pastor at Olney and later at St. Mary Woolnoth in London, where his warm Calvinistic '
        'letters and hymns ministered to countless readers.'
    ),
    'thomas-schreiner': (
        'Thomas R. Schreiner is James Buchanan Harrison Professor of New Testament Interpretation '
        'at The Southern Baptist Theological Seminary. A prolific New Testament scholar and '
        'committed Calvinist, his commentaries on Romans, Galatians, and 1–2 Peter, as well as '
        'his systematic studies on election and the law, are widely used in Reformed Baptist circles.'
    ),
    'herman-bavinck': (
        'Herman Bavinck (1854–1921) was the leading Dutch Reformed theologian of his generation, '
        'professor at the Theological School in Kampen and later at the Free University of Amsterdam. '
        'His four-volume Reformed Dogmatics is now widely recognized as one of the greatest works '
        'of Reformed systematic theology ever written.'
    ),
    'ji-packer': (
        'J. I. Packer (1926–2020) was a British-born Reformed Anglican theologian who taught for '
        'many years at Regent College in Vancouver. His Knowing God (1973) introduced millions to '
        'the doctrines of grace, and his work Evangelism and the Sovereignty of God remains a '
        'beloved reconciliation of Calvinist conviction with passionate evangelistic concern.'
    ),
    'j-i-packer': (
        'J. I. Packer (1926–2020) was a British-born Reformed Anglican theologian who taught for '
        'many years at Regent College in Vancouver. His Knowing God (1973) introduced millions to '
        'the doctrines of grace, and his work Evangelism and the Sovereignty of God remains a '
        'beloved reconciliation of Calvinist conviction with passionate evangelistic concern.'
    ),
    'kim-riddlebarger': (
        'Kim Riddlebarger is senior pastor of Christ Reformed Church in Anaheim, California, and '
        'co-host of the White Horse Inn broadcast. A specialist in eschatology and Reformed '
        'confessionalism, his books A Case for Amillennialism and Man of Sin provide rigorous '
        'biblical and historical defenses of the amillennial position.'
    ),
    'robert-murray-mcheyne': (
        'Robert Murray McCheyne (1813–1843) was a Church of Scotland minister at St. Peter\'s, '
        'Dundee, whose brief life and fervent piety made him one of the most celebrated figures '
        'in Scottish church history. Andrew Bonar\'s Memoir and Remains of McCheyne, along with '
        'his letters and sermons, continue to move readers with their portrait of consecrated '
        'pastoral ministry.'
    ),
    'thomas-chalmers': (
        'Thomas Chalmers (1780–1847) was a Scottish minister, theologian, and social reformer '
        'who led the Disruption of 1843, which produced the Free Church of Scotland. Regarded '
        'as the greatest Scottish churchman of his century, he combined powerful evangelical '
        'preaching with innovative schemes for urban poor relief and church extension.'
    ),
    'thomas-watson': (
        'Thomas Watson (c. 1620–1686) was a Puritan minister at St. Stephen\'s Walbrook, London, '
        'ejected in 1662, whose writings are prized for their clarity, warmth, and memorable style. '
        'His Body of Divinity — an exposition of the Westminster Shorter Catechism — remains '
        'one of the most accessible introductions to Puritan Reformed theology.'
    ),
    'anthony-hoekema': (
        'Anthony Hoekema (1913–1988) was a Dutch-born Reformed theologian who taught systematic '
        'theology at Calvin Theological Seminary for over twenty years. His books The Bible and '
        'the Future and Saved by Grace are widely used defenses of amillennialism and Reformed '
        'soteriology, drawing extensively on Dutch Reformed theological resources.'
    ),
    'augustus-toplady': (
        'Augustus Toplady (1740–1778) was an English Calvinist Anglican clergyman best known as '
        'the author of the hymn "Rock of Ages." A fierce polemicist against Arminianism, he '
        'engaged in sharp controversy with John Wesley, and his work The Historic Proof of the '
        'Doctrinal Calvinism of the Church of England defended Reformed orthodoxy as the true '
        'doctrine of the English church.'
    ),
    'martin-lloyd-jones': (
        'D. Martyn Lloyd-Jones (1899–1981) was a Welsh physician-turned-minister who served at '
        'Westminster Chapel in London for thirty years. His expository sermon series — spanning '
        'Romans, Ephesians, and the Sermon on the Mount — were published in multiple volumes '
        'and are widely considered a high-water mark of Reformed expository preaching in the '
        'twentieth century.'
    ),
    'dr-martyn-lloyd-jones': (
        'D. Martyn Lloyd-Jones (1899–1981) was a Welsh physician-turned-minister who served at '
        'Westminster Chapel in London for thirty years. His expository sermon series — spanning '
        'Romans, Ephesians, and the Sermon on the Mount — were published in multiple volumes '
        'and are widely considered a high-water mark of Reformed expository preaching in the '
        'twentieth century.'
    ),
    'd-martyn-lloyd-jones': (
        'D. Martyn Lloyd-Jones (1899–1981) was a Welsh physician-turned-minister who served at '
        'Westminster Chapel in London for thirty years. His expository sermon series — spanning '
        'Romans, Ephesians, and the Sermon on the Mount — were published in multiple volumes '
        'and are widely considered a high-water mark of Reformed expository preaching in the '
        'twentieth century.'
    ),
    'martyn-lloyd-jones': (
        'D. Martyn Lloyd-Jones (1899–1981) was a Welsh physician-turned-minister who served at '
        'Westminster Chapel in London for thirty years. His expository sermon series — spanning '
        'Romans, Ephesians, and the Sermon on the Mount — were published in multiple volumes '
        'and are widely considered a high-water mark of Reformed expository preaching in the '
        'twentieth century.'
    ),
    'richard-baxter': (
        'Richard Baxter (1615–1691) was a Puritan minister at Kidderminster whose pastoral methods '
        'produced one of the most remarkable parish revivals in English church history. His Reformed '
        'Pastor is a classic guide to pastoral ministry, while his Saints\' Everlasting Rest and '
        'A Call to the Unconverted remain enduring works of practical and evangelistic writing — '
        'though his theology was idiosyncratic and departed from strict Calvinist orthodoxy at points.'
    ),
    'samuel-rutherford': (
        'Samuel Rutherford (c. 1600–1661) was a Scottish Presbyterian minister and professor at '
        'the University of St Andrews, best known for his Lex Rex, a defense of constitutional '
        'government against royal absolutism, and for his Letters, which overflow with affectionate '
        'devotion to Christ and are treasured as some of the most spiritually rich correspondence '
        'in the English language.'
    ),
    'thomas-goodwin': (
        'Thomas Goodwin (1600–1680) was one of the most eminent Puritan theologians, a member '
        'of the Westminster Assembly, and later President of Magdalen College, Oxford, under '
        'Oliver Cromwell. His collected works — especially his volumes on the heart of Christ, '
        'the Holy Spirit, and Ephesians — are noted for their profound experimental and '
        'doctrinal depth.'
    ),
    'em-bounds': (
        'E. M. Bounds (1835–1913) was an American Methodist minister and Civil War chaplain who '
        'devoted the last seventeen years of his life entirely to prayer and writing. His nine '
        'books on prayer — especially Power Through Prayer and Purpose in Prayer — are regarded '
        'as the most thorough and earnest devotional treatments of prayer in the English language.'
    ),
    'iain-murray': (
        'Iain H. Murray is a Scottish minister and co-founder of the Banner of Truth Trust, '
        'which has republished Puritan and Reformed works since 1957. As a biographer of '
        'Spurgeon, Lloyd-Jones, Jonathan Edwards, and others, Murray has done more than almost '
        'anyone to recover the history and writings of the Reformed tradition for modern readers.'
    ),
    'john-bunyan': (
        'John Bunyan (1628–1688) was a Nonconformist minister at Bedford whose twelve years of '
        'imprisonment for preaching without a license produced The Pilgrim\'s Progress (1678), '
        'one of the most widely read works of Christian literature ever written. His Grace '
        'Abounding to the Chief of Sinners is an autobiographical account of his conversion and '
        'spiritual struggles that has comforted countless readers.'
    ),
    'john-knox': (
        'John Knox (c. 1514–1572) was the leading figure of the Scottish Reformation, shaping '
        'the Kirk of Scotland along Calvinist lines that endured for centuries. Influenced by '
        'Calvin in Geneva and by the English Protestant movement, his preaching was instrumental '
        'in the transformation of Scotland\'s religious and political life during the 1560 Reformation.'
    ),
    'john-piper': (
        'John Piper is the founder of desiringGod.org and chancellor of Bethlehem College and '
        'Seminary, having served as senior pastor of Bethlehem Baptist Church in Minneapolis for '
        'thirty-three years. His influential book Desiring God introduced the concept of "Christian '
        'Hedonism" and helped bring Reformed theology to a new generation of evangelicals.'
    ),
    'thomas-brooks': (
        'Thomas Brooks (1608–1680) was a Puritan preacher in London whose practical and devotional '
        'writings are among the most readable in the Puritan corpus. His Precious Remedies Against '
        'Satan\'s Devices is a masterpiece of spiritual warfare literature, and Heaven on Earth '
        'remains a classic treatment of Christian assurance.'
    ),
    'thomas-manton': (
        'Thomas Manton (1620–1677) was a Puritan minister and member of the Westminster Assembly '
        'whose expository preaching and writing produced some of the most voluminous works in the '
        'Puritan tradition. His commentaries on James, Jude, and the 119th Psalm are especially '
        'valued for their thoroughness and practical application.'
    ),
    'cornelius-van-til-phd': (
        'Cornelius Van Til (1895–1987) was a Dutch-born Reformed philosopher and apologist who '
        'taught at Westminster Theological Seminary from its founding until 1972. He developed '
        'the presuppositional method of Christian apologetics, arguing that the triune God of '
        'Scripture is the necessary precondition for all human knowledge and rationality.'
    ),
    'geerhardus-vos': (
        'Geerhardus Vos (1862–1949) was a Dutch-American Reformed theologian who taught biblical '
        'theology at Princeton Seminary for thirty-nine years. Often called the "father of Reformed '
        'biblical theology," his works — especially Biblical Theology and The Pauline Eschatology — '
        'trace the progressive unfolding of redemptive revelation through the covenants of Scripture.'
    ),
    'horatius-bonar': (
        'Horatius Bonar (1808–1889) was a Scottish minister and hymn-writer whose prolific output '
        'of devotional books, Bible commentaries, and hymns earned him the title "Prince of Scottish '
        'Hymn Writers." His God\'s Way of Peace and God\'s Way of Holiness remain classic evangelical '
        'treatments of justification and sanctification.'
    ),
    'joel-r-beeke': (
        'Joel R. Beeke is President of Puritan Reformed Theological Seminary in Grand Rapids, '
        'Michigan, and a pastor of Heritage Netherlands Reformed Congregation. A prolific author '
        'and editor of hundreds of books on Reformed and Puritan theology, he has done more than '
        'almost anyone in the contemporary church to recover the spiritual riches of the Puritan '
        'tradition for modern readers.'
    ),
    'sinclair-ferguson': (
        'Sinclair B. Ferguson is a Scottish Reformed minister and theologian who has served '
        'as professor at Westminster Seminary and as senior minister of First Presbyterian Church '
        'in Columbia, South Carolina. His books — including The Holy Spirit, The Whole Christ, '
        'and Devoted to God — are noted for their clarity, pastoral warmth, and careful biblical '
        'reasoning within the Westminster standards tradition.'
    ),
    'philip-doddridge': (
        'Philip Doddridge (1702–1751) was a prominent English Nonconformist minister and educator '
        'at Northampton whose academy trained ministers across denominational lines. His Rise and '
        'Progress of Religion in the Soul (1745) was one of the most widely read devotional works '
        'of the eighteenth century and was instrumental in the conversions of William Wilberforce '
        'and many others.'
    ),
    'jerome-zanchius': (
        'Girolamo Zanchi (1516–1590) — commonly known as Jerome Zanchius — was an Italian '
        'Reformed theologian who became one of the most rigorous systematic theologians of the '
        'early Reformed tradition. His treatise on absolute predestination, translated and '
        'popularized by Augustus Toplady, is a precise defense of the Calvinist doctrine of '
        'election from both Scripture and patristic sources.'
    ),
    'george-smeaton': (
        'George Smeaton (1814–1889) was a Scottish Free Church theologian who taught at New '
        'College, Edinburgh. His two volumes on the doctrine of the atonement — one focused on '
        'the testimony of Christ, the other on the testimony of the apostles — are considered '
        'the most thorough Reformed treatments of the atonement from the nineteenth century.'
    ),
    'james-buchanan': (
        'James Buchanan (1804–1870) was a Scottish Free Church theologian who taught at New '
        'College, Edinburgh. His work The Doctrine of Justification (1867) is widely regarded '
        'as the most comprehensive historical and doctrinal study of justification by faith '
        'in the English language.'
    ),
    'john-bunyan': (
        'John Bunyan (1628–1688) was a Nonconformist minister at Bedford whose twelve years of '
        'imprisonment for preaching without a license produced The Pilgrim\'s Progress (1678), '
        'one of the most widely read works of Christian literature ever written. His Grace '
        'Abounding to the Chief of Sinners is an autobiographical account of his conversion '
        'and spiritual struggles that has comforted countless readers.'
    ),
}


def run():
    conn = psycopg2.connect(**DB)
    conn.autocommit = False
    cur = conn.cursor()

    updated = 0
    skipped = 0

    for slug, bio in BIOS.items():
        cur.execute(
            "UPDATE authors SET bio = %s WHERE slug = %s AND (bio IS NULL OR bio = '')",
            (bio, slug)
        )
        if cur.rowcount > 0:
            updated += 1
            print(f"  ✓ {slug}")
        else:
            # Either slug doesn't exist or bio already set
            cur.execute("SELECT id FROM authors WHERE slug = %s", (slug,))
            if cur.fetchone():
                skipped += 1
            else:
                print(f"  ! NOT FOUND: {slug}")

    conn.commit()
    cur.close()
    conn.close()
    print(f"\n✓ Done. Updated {updated} authors, skipped {skipped} (bio already set).")


if __name__ == '__main__':
    run()
