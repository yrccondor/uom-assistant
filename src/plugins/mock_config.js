export default [
    {
        url: 'https://test.com/check_ability/',
        method: 'get',
        status: 200,
        headers: {
            'X-UOMA-TOKEN': '00000000000000000000000000000000',
        },
        response: {
            success: true,
            uomabVersion: '0.1.0',
            maintenance: false,
            data: {
                tokenRequired: false,
                allowAccount: true,
                allowSync: true,
                allowEmail: true,
                welcomeMessage: '',
            },
        },
        after: 1000,
    },
    {
        url: 'https://test.com/check_ability/',
        method: 'get',
        status: 200,
        headers: {},
        response: {
            success: true,
            uomabVersion: '0.1.0',
            maintenance: false,
            data: {
                tokenRequired: true,
            },
        },
        after: 1000,
    },
    {
        url: 'https://test2.com/check_ability/',
        method: 'get',
        status: 200,
        headers: {},
        response: {
            success: true,
            uomabVersion: '0.1.0',
            maintenance: false,
            data: {
                tokenRequired: false,
                welcomeMessage: 'Welcome!',
                allowAccount: false,
                allowSync: true,
                allowEmail: false,
            },
        },
        after: 1000,
    },
    {
        url: 'https://test3.com/check_ability/',
        method: 'get',
        status: 200,
        headers: {},
        response: {
            success: true,
            uomabVersion: '0.1.0',
            maintenance: true,
            data: {
                tokenRequired: true,
            },
        },
        after: 1000,
    },
    {
        url: 'https://dev.axton.cc:1737/check_ability/',
        method: 'get',
        status: 200,
        headers: {},
        response: {
            success: true,
            uomabVersion: '0.1.0',
            maintenance: false,
            data: {
                tokenRequired: false,
                allowAccount: true,
                allowSync: true,
                allowEmail: true,
            },
        },
        after: 1000,
    },
    {
        url: 'https://dev.axton.cc:1737/attendance/',
        method: 'post',
        status: 200,
        headers: {},
        response: {
            success: true,
            uomabVersion: '0.1.0',
            maintenance: false,
            data: {
                lastMonth: '100',
                annual: '95',
                absentRecord: [
                    {
                        name: 'Workshop-week1',
                        subject: 'COMP16412',
                        date: '2021-02-09',
                    },
                    {
                        name: 'Sem2 Week 1',
                        subject: 'COMP12120',
                        date: '2021-02-12',
                    },
                ],
            },
        },
        after: 1000,
    },
    {
        url: 'https://dev.axton.cc:1737/grade/',
        method: 'post',
        status: 200,
        headers: {},
        response: {
            success: true,
            uomabVersion: '0.1.0',
            maintenance: false,
            data: [
                {
                    subject: 'COMP12120',
                    name: 'First Year Team Project',
                    weightedGrade: '35',
                    detail: [
                        [
                            {
                                rawName: '12120-Quiz1-F-Lab1',
                                name: 'Quiz1-Lab1',
                                summative: false,
                                grade: '36',
                                gradePercentage: '100',
                                time: '2020-12-16 17:00:00',
                                late: false,
                            },
                            {
                                rawName: '12120-Quiz2-F-Lab 2',
                                name: 'Quiz2-Lab 2',
                                summative: false,
                                grade: '40',
                                gradePercentage: '100',
                                time: '2020-12-16 17:00:00',
                                late: false,
                            },
                            {
                                rawName: '12120-Quiz3-F-Lab 3',
                                name: 'Quiz3-Lab 3',
                                summative: false,
                                grade: '50',
                                gradePercentage: '100',
                                time: '2020-12-16 17:00:00',
                                late: false,
                            },
                            {
                                rawName: '12120-Quiz4-F-Lab 4',
                                name: 'Quiz4-Lab 4',
                                summative: false,
                                grade: '57',
                                gradePercentage: '95',
                                time: '2020-12-16 17:00:00',
                                late: false,
                            },
                            {
                                rawName: '12120-Quiz5-F-Lab 5',
                                name: 'Quiz5-Lab 5',
                                summative: false,
                                grade: '180',
                                gradePercentage: '92',
                                time: '2020-12-16 17:00:00',
                                late: false,
                            },
                        ],
                        {
                            rawName: '12120-presentation1-S-Sem 1 Presentation',
                            name: 'presentation1-Sem 1 Presentation',
                            summative: true,
                            grade: '15',
                            gradePercentage: '90',
                            time: '2020-12-16 18:00:00',
                            late: false,
                        },
                        {
                            rawName: '12120-report-S-Reflective Report',
                            name: 'report-Reflective Report',
                            summative: true,
                            grade: '8',
                            gradePercentage: '75',
                            time: '2021-02-12 09:00:00',
                            late: false,
                        },
                    ],
                },
                {
                    subject: 'COMP13222',
                    name: 'Data Science',
                    weightedGrade: '0',
                    detail: [],
                },
                {
                    subject: 'COMP11121',
                    name: 'Mathematical Techniques for Computer Science',
                    weightedGrade: '48',
                    detail: [
                        [
                            {
                                rawName: '11121-sheet00-F-Sheet 0',
                                name: 'sheet00-Sheet 0',
                                summative: false,
                                grade: '4',
                                gradePercentage: '80',
                                time: '2020-10-05 11:00:00',
                                late: false,
                            },
                            {
                                rawName: '11121-sheet01-S-Sheet 1',
                                name: 'sheet01-Sheet 1',
                                summative: true,
                                grade: '5',
                                gradePercentage: '100',
                                time: '2020-10-12 11:00:00',
                                late: false,
                            },
                            {
                                rawName: '11121-sheet02-S-Sheet 2',
                                name: 'sheet02-Sheet 2',
                                summative: true,
                                grade: '5',
                                gradePercentage: '100',
                                time: '2020-10-19 11:00:00',
                                late: false,
                            },
                            {
                                rawName: '11121-sheet03-S-Sheet 3',
                                name: 'sheet03-Sheet 3',
                                summative: true,
                                grade: '2',
                                gradePercentage: '60',
                                time: '2020-10-26 12:00:00',
                                late: false,
                            },
                            {
                                rawName: '11121-sheet04-S-Sheet 4',
                                name: 'sheet04-Sheet 4',
                                summative: true,
                                grade: '3',
                                gradePercentage: '60',
                                time: '2020-11-02 12:00:00',
                                late: false,
                            },
                            {
                                rawName: '11121-sheet05-S-Sheet 5',
                                name: 'sheet05-Sheet 5',
                                summative: true,
                                grade: '3',
                                gradePercentage: '60',
                                time: '2020-11-09 12:00:00',
                                late: false,
                            },
                            {
                                rawName: '11121-sheet06-S-Sheet 6',
                                name: 'sheet06-Sheet 6',
                                summative: true,
                                grade: '4',
                                gradePercentage: '80',
                                time: '2020-11-16 12:00:00',
                                late: true,
                            },
                            {
                                rawName: '11121-sheet07-S-Sheet 7',
                                name: 'sheet07-Sheet 7',
                                summative: true,
                                grade: '5',
                                gradePercentage: '100',
                                time: '2020-11-23 12:00:00',
                                late: false,
                            },
                            {
                                rawName: '11121-sheet08-S-Sheet 8',
                                name: 'sheet08-Sheet 8',
                                summative: true,
                                grade: '4',
                                gradePercentage: '80',
                                time: '2020-11-30 12:00:00',
                                late: false,
                            },
                            {
                                rawName: '11121-sheet09-S-Sheet 9',
                                name: 'sheet09-Sheet 9',
                                summative: true,
                                grade: '4',
                                gradePercentage: '80',
                                time: '2020-12-07 12:00:00',
                                late: true,
                            },
                            {
                                rawName: '11121-sheet10-S-Sheet 10',
                                name: 'sheet10-Sheet 10',
                                summative: true,
                                grade: '5',
                                gradePercentage: '100',
                                time: '2020-12-14 12:00:00',
                                late: false,
                            },
                        ],
                    ],
                },
                {
                    subject: 'COMP15222',
                    name: 'Operating Systems',
                    weightedGrade: '0',
                    detail: [],
                },
            ],
        },
        after: 1000,
    },
];
