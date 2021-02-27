<?php
require('../vendor/autoload.php');
include('../common/functions.php');
include('../common/cache.php');

use Goutte\Client;
use Symfony\Component\HttpClient\HttpClient;

$conn = connect_to_database();

// Check token
if (!UOMA_CONFIG['allow_unauthenticated']) {
    $token_ability = check_token($conn);
    if (check_token($conn) === false) {
        // Token not verified
        rest_response(array(
            'tokenRequired' => true
        ));

        $conn->close();
        die();
    }
} else if (!UOMA_CONFIG['allow_account']) {
    // Don't allow
    rest_die('Feature not allowed.', $conn);
}

// Get cahced data (if exists)
$user = get_user();
$cached_response = get_cache('grade', $user['username'], $conn);

if ($cached_response !== false) {
    // Send cached response back
    rest_response($cached_response);

    $conn->close();
} else {
    // Set up HTTP client
    $httpClient = HttpClient::create([
        'timeout' => 30,
        'headers' => [
            'User-Agent' => UOMA_USER_AGENT,
        ],
    ]);

    $client = new Client($httpClient);

    $client->restart();

    // Login from CAS, regardless of Cookie since there is already a cache layer
    $client->request(
        'GET',
        'https://login.manchester.ac.uk/cas/login?service=https%3A%2F%2Fstudentnet.cs.manchester.ac.uk%2Fme%2Fspot%2F'
    );

    $crawler = $client->submitForm('Login', [
        'username' => $user['username'],
        'password' => $user['password'],
    ]);

    if (strpos($crawler->html(), 'class="courseHeader"') === false) {
        rest_die('Unable to login', $conn);
    }

    // Read grades
    $grade_list = $crawler->filter($crawler->filter('.container')->first()->filter('ul.nav.nav-tabs > li.nav-item.active > a')->attr('href'))->first()->filter('.container > table.cwk')->each(function(\Symfony\Component\DomCrawler\Crawler $node, $i) {
        $subject = explode(' ', $node->filter('td.courseHeader > b')->first()->text());
        $subject_id = $subject[0];
        array_pop($subject);
        array_shift($subject);
        $grade_detail = array_values(array_filter($node->filter('tr')->each(function(\Symfony\Component\DomCrawler\Crawler $tr, $j) {
            if ($j >= 2) {
                if (strpos($tr->text(), 'Weighted summative') === false) {
                    $grade = trim($tr->filter('td')->eq(1)->text());
                    if ($grade !== '' && explode(' /', $grade)[0] !== '#') {
                        $name = $tr->filter('td')->eq(0)->text();
                        $display_name = substr(str_replace('-S-', '-', str_replace('-F-', '-', $name)), 6);
                        return array(
                            'rawName' => $name,
                            'name' => $display_name,
                            'summative' => strpos($name, '-S-') !== false,
                            'grade' => explode(' /', $grade)[0],
                            'gradePercentage' => strpos($grade, 'LATE') !== false ? substr(explode('(', $grade)[1], 0, -7) : substr(explode('(', $grade)[1], 0, -2),
                            'time' => date_format(date_create_from_format('d-M-y H:i', trim($tr->filter('td')->eq(2)->text())), 'Y-m-d H:i:s'),
                            'late' => strpos($grade, 'LATE') !== false,
                        );
                    }
                    return false;
                }
                return false;
            }
            return false;
        })));

        // Aggregate similar courseworks
        $patterns = [];
        foreach ($grade_detail as $index => $grade_item) {
            if (count($patterns) === 0) {
                $patterns[] = array(
                    'pattern' => preg_replace('/\d/', '', $grade_item['rawName']),
                    'index' => [$index]
                );
            } else {
                $found_flag = false;
                $name = preg_replace('/\d/', '', $grade_item['rawName']);
                foreach ($patterns as &$pattern) {
                    if (levenshtein($pattern['pattern'], $name) <= 1) {
                        $pattern['index'][] = $index;
                        $found_flag = true;
                        break;
                    }
                }
                unset($pattern);
                if (!$found_flag) {
                    $patterns[] = array(
                        'pattern' => $name,
                        'index' => [$index]
                    );
                }
            }
        }

        if (count($patterns) > 0) {
            $new_list = [];
            foreach ($patterns as $pattern) {
                if (count($pattern['index']) > 1) {
                    $similar_set = [];
                    foreach ($pattern['index'] as $index) {
                        $similar_set[] = $grade_detail[$index];
                    }
                    $new_list[] = $similar_set;
                } else {
                    $new_list[] = $grade_detail[$pattern['index'][0]];
                }
            }
        } else {
            $new_list = $grade_detail;
        }

        return array(
            'subject' => $subject_id,
            'name' => implode(' ', $subject),
            'weightedGrade' => substr($node->filter('td.totalSoFar > b')->first()->text(), 0, -1),
            'detail' => $new_list
        );
    });

    // Response
    rest_response($grade_list);

    // Set cache
    set_cache('grade', $user['username'], $grade_list, '+3 hours', $conn);

    $conn->close();
}

?>