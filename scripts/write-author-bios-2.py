#!/usr/bin/env python3
"""Second batch of author bios — researched from web sources."""

import psycopg2

DB = {
    'host': 'db.xhhvbxjllictpxtebeur.supabase.co',
    'dbname': 'postgres',
    'user': 'postgres',
    'password': 'hzwij3$9Tzy%Oq7Y',
    'port': 5432,
}

BIOS = {
    'charles-bridges': (
        'Charles Bridges (1794–1869) was an Anglican evangelical minister and a leading voice in the '
        'Church of England\'s Evangelical Party. He is best remembered for his 1829 treatise The '
        'Christian Ministry and for his widely-used expository commentaries on Proverbs, Ecclesiastes, '
        'and Psalm 119.'
    ),
    'jc-philpot': (
        'Joseph Charles Philpot (1802–1869) was an Oxford-educated Anglican curate who resigned his '
        'orders in 1835 to become a Strict and Particular Baptist minister. He is remembered for his '
        'deeply experiential preaching and as the long-serving editor of The Gospel Standard magazine, '
        'which shaped English Strict Baptist piety for generations.'
    ),
    'david-dickson': (
        'David Dickson (1583–1663) was a Church of Scotland minister and theologian who served as '
        'Professor of Divinity at Glasgow and Edinburgh. He is known for his biblical commentaries '
        'on the Psalms and Pauline epistles, his co-authorship of The Sum of Saving Knowledge, and '
        'his prominent role in the Covenanting movement.'
    ),
    'william-symington': (
        'William Symington (1795–1862) was a Scottish Reformed Presbyterian minister and theologian '
        'who pastored in Stranraer and Glasgow and later served as professor of theology for the '
        'Reformed Presbyterian Church of Scotland. He is best known for Messiah the Prince (1839), '
        'a landmark defense of Christ\'s mediatorial kingship over the nations.'
    ),
    'alexander-whyte': (
        'Alexander Whyte (1836–1921) was a Free Church of Scotland minister who served for decades '
        'at Free St George\'s in Edinburgh and later became Principal of New College, Edinburgh. '
        'Often called "the last of the Puritans," he was known for his searching pulpit ministry '
        'and his writings on Puritan spirituality and John Bunyan\'s Pilgrim\'s Progress.'
    ),
    'johannes-g-vos': (
        'Johannes G. Vos (1903–1983), eldest son of Geerhardus Vos, was a Reformed Presbyterian '
        'minister, missionary to Manchuria, and professor at Geneva College in Pennsylvania. He '
        'founded and edited Blue Banner Faith and Life, helping revive confessional Reformed theology '
        'within the Reformed Presbyterian Church of North America.'
    ),
    'james-durham': (
        'James Durham (1622–1658) was a Scottish Covenanting minister who served the Inner Kirk in '
        'Glasgow and briefly as chaplain to King Charles II. Despite dying at thirty-five, he left '
        'lasting works including a celebrated commentary on the Song of Solomon and a treatise on '
        'church unity, A Treatise Concerning Scandal.'
    ),
    'william-perkins': (
        'William Perkins (1558–1602) was an English Reformed theologian and fellow of Christ\'s '
        'College, Cambridge, whose lectures at St Andrew the Great made him the foremost Puritan '
        'voice of the Elizabethan era. Dubbed the "father of Puritanism," his works on predestination, '
        'assurance, and practical divinity outsold Calvin and Beza in England and shaped a generation '
        'of Puritan ministers on both sides of the Atlantic.'
    ),
    'thomas-shepard': (
        'Thomas Shepard (1605–1649) was an English Puritan minister who fled Archbishop Laud\'s '
        'persecution to become pastor of the first church in Cambridge, Massachusetts. A leading voice '
        'against Antinomianism during the Hutchinson controversy, he is remembered for his searching '
        'writings on saving grace, including The Sincere Convert and The Sound Believer.'
    ),
    'asahel-nettleton': (
        'Asahel Nettleton (1783–1844) was a Connecticut-born Calvinist evangelist and Yale graduate '
        'who became one of the most effective revivalists of the Second Great Awakening, with an '
        'estimated 30,000 conversions attributed to his ministry. He opposed Charles Finney\'s "new '
        'measures," defending a more traditional and doctrinally careful Reformed approach to evangelism.'
    ),
    'william-gouge': (
        'William Gouge (1575–1653) was an English Puritan minister who served St Anne Blackfriars '
        'in London for forty-five years and was a prominent member of the Westminster Assembly, '
        'chairing the committee that drafted the Westminster Confession. He is best known for his '
        '1622 work Of Domestical Duties on family life and a posthumously published commentary on Hebrews.'
    ),
    'richard-sibbs': (
        'Richard Sibbes (1577–1635) was an Anglican Puritan who lectured at Holy Trinity Church, '
        'Cambridge, and served as preacher at Gray\'s Inn and Master of St Catharine\'s Hall. He is '
        'beloved for his warm, Christ-centered devotional writings, especially The Bruised Reed and '
        'Smoking Flax (1630), which influenced Spurgeon and Lloyd-Jones among countless others.'
    ),
    'samuel-miller': (
        'Samuel Miller (1769–1850) was a Presbyterian minister and founding professor of Ecclesiastical '
        'History and Church Government at Princeton Theological Seminary, where he taught from 1813 '
        'to 1849. A churchman of the Old School tradition, he authored numerous works on Presbyterian '
        'polity, church history, and practical theology.'
    ),
    'james-henley-thornwell': (
        'James Henley Thornwell (1812–1862) was a South Carolina Presbyterian minister, president of '
        'South Carolina College, and professor of theology at Columbia Theological Seminary, widely '
        'regarded as the antebellum South\'s most formidable theologian. He founded the Southern '
        'Presbyterian Review and wrote extensively on ecclesiology, Scripture, and Reformed doctrine.'
    ),
    'james-m-boice': (
        'James Montgomery Boice (1938–2000) was a Reformed theologian and senior minister of Tenth '
        'Presbyterian Church in Philadelphia from 1968 until his death. A founding member of the '
        'Alliance of Confessing Evangelicals and chairman of the International Council on Biblical '
        'Inerrancy, he authored more than fifty books and was widely influential in defending expository '
        'preaching and biblical inerrancy within American evangelicalism.'
    ),
    'james-montgomery-boice': (
        'James Montgomery Boice (1938–2000) was a Reformed theologian and senior minister of Tenth '
        'Presbyterian Church in Philadelphia from 1968 until his death. A founding member of the '
        'Alliance of Confessing Evangelicals and chairman of the International Council on Biblical '
        'Inerrancy, he authored more than fifty books and was widely influential in defending expository '
        'preaching and biblical inerrancy within American evangelicalism.'
    ),
    'kenneth-l-gentry-jr': (
        'Kenneth L. Gentry Jr. is an ordained Reformed Presbyterian minister, author, and conference '
        'speaker who served over thirty-seven years in pastoral ministry. He is the leading contemporary '
        'Reformed advocate for postmillennialism and preterism, best known for He Shall Have Dominion '
        'and a major commentary on Revelation.'
    ),
    'kenneth-l-gentry-jr-2': (
        'Kenneth L. Gentry Jr. is an ordained Reformed Presbyterian minister, author, and conference '
        'speaker who served over thirty-seven years in pastoral ministry. He is the leading contemporary '
        'Reformed advocate for postmillennialism and preterism, best known for He Shall Have Dominion '
        'and a major commentary on Revelation.'
    ),
    'tom-ascol': (
        'Tom Ascol is a Reformed Baptist pastor who has served Grace Baptist Church in Cape Coral, '
        'Florida, since 1986 and is the president of Founders Ministries, which promotes the recovery '
        'of Calvinist soteriology within the Southern Baptist Convention. He has edited the Founders '
        'Journal and written widely on Reformed Baptist theology and ecclesiology.'
    ),
    'william-s-plumer': (
        'William Swan Plumer (1802–1880) was an American Presbyterian minister and theologian who '
        'pastored prominent churches in Richmond, Baltimore, and Allegheny before serving as professor '
        'of theology at Columbia Theological Seminary. He authored more than twenty-five books, including '
        'substantial commentaries on Romans, Hebrews, and Psalms.'
    ),
    'cornelis-p-venema': (
        'Cornelis P. Venema is a Dutch-Reformed theologian who served as president and professor of '
        'doctrinal studies at Mid-America Reformed Seminary in Indiana, holding a PhD from Princeton '
        'Theological Seminary. He has written extensively on covenant theology, Reformation theology, '
        'eschatology, and Reformed confessionalism.'
    ),
    'erroll-hulse': (
        'Erroll Hulse (1931–2017) was a South African-born Reformed Baptist pastor who ministered in '
        'England for more than four decades, serving churches in Cuckfield, Liverpool, and Leeds. He '
        'founded Reformation Today magazine in 1970 and served as its editor for over forty years, '
        'becoming a major figure in the twentieth-century Reformed Baptist revival.'
    ),
    'david-j-engelsma': (
        'David J. Engelsma (b. 1939) is a Protestant Reformed theologian who pastored Protestant '
        'Reformed Churches before serving as professor of Dogmatics and Old Testament at the Protestant '
        'Reformed Theological Seminary in Grand Rapids. A prolific contributor to The Standard Bearer, '
        'he has written on marriage, covenant theology, amillennialism, and the distinctive doctrines '
        'of the Protestant Reformed tradition.'
    ),
    'prof-david-j-engelsma': (
        'David J. Engelsma (b. 1939) is a Protestant Reformed theologian who pastored Protestant '
        'Reformed Churches before serving as professor of Dogmatics and Old Testament at the Protestant '
        'Reformed Theological Seminary in Grand Rapids. A prolific contributor to The Standard Bearer, '
        'he has written on marriage, covenant theology, amillennialism, and the distinctive doctrines '
        'of the Protestant Reformed tradition.'
    ),
    'r-a-finlayson': (
        'Roderick A. Finlayson (1895–1989) was a Free Church of Scotland minister from the Scottish '
        'Highlands who became Professor of Systematic Theology at the Free Church College in Edinburgh. '
        'Co-founder of the Scottish Tyndale Fellowship, he was regarded as one of the sharpest '
        'conservative Reformed theologians of his era, combining doctrinal rigor with a richly '
        'devotional style.'
    ),
    'ra-finlayson': (
        'Roderick A. Finlayson (1895–1989) was a Free Church of Scotland minister from the Scottish '
        'Highlands who became Professor of Systematic Theology at the Free Church College in Edinburgh. '
        'Co-founder of the Scottish Tyndale Fellowship, he was regarded as one of the sharpest '
        'conservative Reformed theologians of his era, combining doctrinal rigor with a richly '
        'devotional style.'
    ),
    'richard-owen-roberts': (
        'Richard Owen Roberts is an American evangelist, publisher, and bibliographer who directed '
        'the Billy Graham Center Library at Wheaton before founding International Awakening Ministries. '
        'He is best known for Revival Literature: An Annotated Bibliography, cataloguing over five '
        'thousand titles on the subject of revival.'
    ),
    'ernest-c-reisinger': (
        'Ernest C. Reisinger (1919–2004) was a Reformed Baptist pastor in Florida whose vision for '
        'recovering Calvinist soteriology among Southern Baptists directly gave rise to Founders '
        'Ministries. He distributed thousands of copies of J. P. Boyce\'s Abstract of Systematic '
        'Theology and helped organize the conferences in the 1980s from which the Founders movement grew.'
    ),
    'earnest-c-reisinger': (
        'Ernest C. Reisinger (1919–2004) was a Reformed Baptist pastor in Florida whose vision for '
        'recovering Calvinist soteriology among Southern Baptists directly gave rise to Founders '
        'Ministries. He distributed thousands of copies of J. P. Boyce\'s Abstract of Systematic '
        'Theology and helped organize the conferences in the 1980s from which the Founders movement grew.'
    ),
    'herman-c-hoeksema': (
        'Herman Hoeksema (1886–1965) was a Dutch-born Reformed theologian and pastor who emigrated '
        'to the United States and co-founded the Protestant Reformed Churches in 1924. He served as '
        'professor of theology at the Protestant Reformed Seminary for forty years and authored '
        'Reformed Dogmatics, the most extensive systematic theology produced within the Protestant '
        'Reformed tradition.'
    ),
    'richard-b-gaffin-jr': (
        'Richard B. Gaffin Jr. (b. 1936) is a Reformed theologian and minister who taught at '
        'Westminster Theological Seminary in Philadelphia for over forty years, holding the Charles '
        'Krahe Chair of Biblical and Systematic Theology. Building on Geerhardus Vos\'s biblical '
        'theology, he made landmark contributions to the study of Paul\'s theology of resurrection '
        'in Resurrection and Redemption (1978).'
    ),
    'walter-chantry': (
        'Walter J. Chantry (1938–2022) was a Reformed Baptist pastor who served Grace Baptist Church '
        'in Carlisle, Pennsylvania, for nearly four decades and later edited The Banner of Truth '
        'magazine. A Westminster Seminary graduate, he is best remembered for Today\'s Gospel: '
        'Authentic or Synthetic?, a searching critique of modern evangelistic methods.'
    ),
    'j-ligon-duncan': (
        'J. Ligon Duncan III (b. 1960) is a Presbyterian Church in America minister and theologian '
        'who served as senior pastor of First Presbyterian Church in Jackson, Mississippi, before '
        'becoming Chancellor of Reformed Theological Seminary. He earned his PhD from the University '
        'of Edinburgh and has written and lectured widely on Reformed worship and systematic theology.'
    ),
    'ligon-duncan': (
        'J. Ligon Duncan III (b. 1960) is a Presbyterian Church in America minister and theologian '
        'who served as senior pastor of First Presbyterian Church in Jackson, Mississippi, before '
        'becoming Chancellor of Reformed Theological Seminary. He earned his PhD from the University '
        'of Edinburgh and has written and lectured widely on Reformed worship and systematic theology.'
    ),
    'john-m-frame': (
        'John M. Frame (b. 1939) is a Reformed philosopher and theologian who taught at Westminster '
        'Theological Seminary and Reformed Theological Seminary. He is best known for developing '
        '"triperspectivalism" as an approach to Christian epistemology and ethics, and for major '
        'works including The Doctrine of the Knowledge of God and a multi-volume systematic theology.'
    ),
    'william-e-cox': (
        'William E. Cox was an American Baptist pastor and author best known as a clear popular '
        'defender of amillennialism. His Amillennialism Today (1966) and An Examination of '
        'Dispensationalism remain accessible introductions to the non-dispensational position, '
        'written from a conservative, Scripture-focused standpoint.'
    ),
    'david-macintyre': (
        'David M\'Intyre (1859–1938) was a Scottish Free Church minister who succeeded Andrew Bonar '
        'at Finnieston and later became Principal of the Bible Training Institute in Glasgow. He is '
        'best remembered for The Hidden Life of Prayer (1891), a devotional classic on the practice '
        'of prayer that has remained in continuous print for over a century.'
    ),
    'kerry-ptacek': (
        'Kerry Ptacek is an Associate Reformed Presbyterian pastor and author who advocates for the '
        'recovery of household worship. He is the author of Family Worship: Biblical Basis, Historical '
        'Reality, Current Need (1994), a historically grounded examination of the biblical warrant '
        'for regular family devotions.'
    ),
    'brian-schwertley': (
        'Brian M. Schwertley is a minister in the Covenanted Reformed Presbyterian tradition who '
        'has written extensively on the regulative principle of worship and Reformed ecclesiology. '
        'His major work, Sola Scriptura and the Regulative Principle of Worship, is regarded as '
        'the most detailed contemporary defense of the confessional Reformed position on worship.'
    ),
    'james-macgregor': (
        'James MacGregor (1829–1894) was a Free Church of Scotland minister who became Professor '
        'of Systematic Theology at New College, Edinburgh, before emigrating to serve the Presbyterian '
        'Church in New Zealand. He authored a handbook of Reformed systematic theology and contributed '
        'to major ecclesiastical controversies of his era.'
    ),
    'theodore-beza': (
        'Theodore Beza (1519–1605) was a French Reformed theologian and scholar who joined Calvin in '
        'Geneva in 1548, served as rector of the Geneva Academy, and succeeded Calvin as the leading '
        'pastor of Geneva. He made lasting contributions through his critical work on the Greek New '
        'Testament, his biography of Calvin, and his defense of Calvinist orthodoxy.'
    ),
    'theodore-beza-1519-1605': (
        'Theodore Beza (1519–1605) was a French Reformed theologian and scholar who joined Calvin in '
        'Geneva in 1548, served as rector of the Geneva Academy, and succeeded Calvin as the leading '
        'pastor of Geneva. He made lasting contributions through his critical work on the Greek New '
        'Testament, his biography of Calvin, and his defense of Calvinist orthodoxy.'
    ),
    'james-m-renihan': (
        'James M. Renihan is a Reformed Baptist minister, church historian, and president of '
        'International Reformed Baptist Seminary in Mansfield, Texas. He is the foremost contemporary '
        'scholar of seventeenth-century Particular Baptist confessional documents, with major works '
        'on the 1644 and 1689 Baptist Confessions of Faith.'
    ),
    'michael-ag-haykin': (
        'Michael A.G. Haykin is a British-born church historian and professor of church history at '
        'the Southern Baptist Theological Seminary, where he also directs the Andrew Fuller Center '
        'for Baptist Studies. He has authored or edited more than twenty-five books on the early '
        'church fathers, eighteenth-century evangelicalism, and Baptist history.'
    ),
    'john-a-broadus': (
        'John A. Broadus (1827–1895) was a Baptist minister, co-founder of the Southern Baptist '
        'Theological Seminary, and its professor of New Testament and homiletics from 1859. Charles '
        'Spurgeon called him "the greatest of living preachers," and his On the Preparation and '
        'Delivery of Sermons (1870) became a standard homiletics textbook used across denominational '
        'lines for over a century.'
    ),
    'samuel-t-logan-jr': (
        'Samuel T. Logan Jr. (b. 1943) is a Presbyterian minister and historian who served as '
        'president of Westminster Theological Seminary from 1991 to 2005 and later as international '
        'director of the World Reformed Fellowship. He has written and lectured on Jonathan Edwards, '
        'Reformed preaching, and church history.'
    ),
    'geoff-thomas': (
        'Geoff Thomas (b. 1938) is a Welsh Particular Baptist minister who served Alfred Place '
        'Baptist Church in Aberystwyth for fifty years, preaching through virtually every verse '
        'of Scripture. A Westminster Seminary-trained pastor and visiting professor at Puritan '
        'Reformed Theological Seminary, he is widely respected in Reformed Baptist circles.'
    ),
    'thomas-boston': (
        'Thomas Boston (1676–1732) was a Scottish minister at Ettrick whose pastoral warmth and '
        'theological depth made him one of the most beloved figures in Scottish church history. '
        'His Human Nature in Its Fourfold State remains a devotional and doctrinal classic, and '
        'his role in the "Marrow Controversy" placed him at the center of debates over free grace '
        'in the Scottish church.'
    ),
    # Additional well-known authors not in first batch
    'richard-sibbs': (
        'Richard Sibbes (1577–1635) was an Anglican Puritan who lectured at Holy Trinity Church, '
        'Cambridge, and served as preacher at Gray\'s Inn and Master of St Catharine\'s Hall. He is '
        'beloved for his warm, Christ-centered devotional writings, especially The Bruised Reed and '
        'Smoking Flax (1630), which influenced Spurgeon and Lloyd-Jones among countless others.'
    ),
    'jw-alexander': (
        'James Waddel Alexander (1804–1859) was an American Presbyterian minister, theologian, and '
        'son of Archibald Alexander, who served as professor at Princeton Seminary before becoming '
        'pastor of Fifth Avenue Presbyterian Church in New York. His Thoughts on Preaching and '
        'Consolation to the Afflicted are among his most enduring works.'
    ),
    'cornelius-van-til-phd': (
        'Cornelius Van Til (1895–1987) was a Dutch-born Reformed philosopher and apologist who '
        'taught at Westminster Theological Seminary from its founding until 1972. He developed '
        'the presuppositional method of Christian apologetics, arguing that the triune God of '
        'Scripture is the necessary precondition for all human knowledge and rationality.'
    ),
}


def run():
    conn = psycopg2.connect(**DB)
    conn.autocommit = False
    cur = conn.cursor()

    updated = 0
    skipped = 0
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
            cur.execute("SELECT id, bio FROM authors WHERE slug = %s", (slug,))
            row = cur.fetchone()
            if row:
                if row[1]:
                    skipped += 1
                else:
                    print(f"  ? Already set or empty: {slug}")
            else:
                not_found += 1
                print(f"  ! NOT FOUND: {slug}")

    conn.commit()
    cur.close()
    conn.close()
    print(f"\n✓ Done. Updated {updated}, skipped {skipped} (already had bio), not found: {not_found}.")


if __name__ == '__main__':
    run()
