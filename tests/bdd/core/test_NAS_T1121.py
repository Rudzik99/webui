# coding=utf-8
"""Core UI feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T1121.feature', 'Verify Amazon S3 Cloud Sync task works')
def test_verify_amazon_s3_cloud_sync_task_works(driver):
    """Verify Amazon S3 Cloud Sync task works."""
    pass


@given('the browser is open on the TrueNAS URL and logged in')
def the_browser_is_open_on_the_truenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open on the TrueNAS URL and logged in."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, '//input[@placeholder="Username"]')
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, '//input[@placeholder="Username"]')
        driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys('root')
        driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys(root_password)
        assert wait_on_element(driver, 5, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the dashboard, click on Storage on the side menu, click on Pools')
def on_the_dashboard_click_on_storage_on_the_side_menu_click_on_pools(driver):
    """on the dashboard, click on Storage on the side menu, click on Pools."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Pools"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Pools"]').click()


@then('click on the tank pool three dots button, select Add Dataset')
def click_on_the_tank_pool_three_dots_button_select_add_dataset(driver):
    """click on the tank pool three dots button, select Add Dataset."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Pools")]')
    assert wait_on_element(driver, 5, '//mat-icon[@id="actions_menu_button__tank"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__tank"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__tank_Add Dataset"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__tank_Add Dataset"]').click()
    assert wait_on_element(driver, 5, '//h4[contains(.,"Name and Options")]')


@then('input aws_share for Name, select Generic as Share Type and click Submit')
def input_aws_share_for_name_select_generic_as_share_type_and_click_submit(driver):
    """input aws_share for Name, select Generic as Share Type and click Submit."""
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys('aws_share')
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Share Type"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Share Type"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Share Type_Generic"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Share Type_Generic"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SUBMIT"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()


@then('the dataset should be created without error')
def the_dataset_should_be_created_without_error(driver):
    """the dataset should be created without error."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"aws_share")]')


@then('click Tasks on the left sidebar, then click on Cloud Sync Tasks')
def click_tasks_on_the_left_sidebar_then_click_on_cloud_sync_tasks(driver):
    """click Tasks on the left sidebar, then click on Cloud Sync Tasks."""
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Tasks"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Tasks"]').click()
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Cloud Sync Tasks"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Cloud Sync Tasks"]').click()


@then('on the Cloud Sync Tasks, click ADD')
def on_the_cloud_sync_tasks_click_add(driver):
    """on the Cloud Sync Tasks, click ADD."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Cloud Sync Tasks")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__Cloud Sync Tasks_ADD"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__Cloud Sync Tasks_ADD"]').click()


@then('input a description and ensure PULL is selected as the Direction')
def input_a_description_and_ensure_pull_is_selected_as_the_direction(driver):
    """input a description and ensure PULL is selected as the Direction."""
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@placeholder="Description"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Description"]').send_keys('My S3 AWS Share')
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"PULL")]')


@then(parsers.parse('select "{selection}" under the Credential drop-down'))
def select_selection_under_the_credential_dropdown(driver, selection):
    """select "selection" under the Credential drop-down."""
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Credential"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Credential"]').click()
    assert wait_on_element(driver, 5, f'//mat-option[@ix-auto="option__Credential_{selection}"]', 'clickable')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Credential_{selection}"]').click()


@then(parsers.parse('select the {bucket} bucket, then Under Directory/Files, choose aws_share'))
def select_the_bucket_bucket_then_under_directoryfiles_choose_aws_share(driver, bucket):
    """select the {bucket} bucket, then Under Directory/Files, choose aws_share."""


@then('under Transfer Mode, select COPY, click Save')
def under_transfer_mode_select_copy_click_save(driver):
    """under Transfer Mode, select COPY, click Save."""
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"COPY")]')


@then('the new Cloud Sync Tasks should save without error')
def the_new_cloud_sync_tasks_should_save_without_error(driver):
    """the new Cloud Sync Tasks should save without error."""


@then('open a new tab navigate to <s3_url> and input <account_id>')
def open_a_new_tab_navigate_to_s3_url_and_input_account_id(driver, s3_url, account_id):
    """open a new tab navigate to <s3_url> and input <account_id>."""


@then('input <user_name> and <password>, click Sign in')
def input_user_name_and_password_click_sign_in(driver, user_name, password):
    """input <user_name> and <password>, click Sign in."""


@then('click on the bucket being used and then upload a file')
def click_on_the_bucket_being_used_and_then_upload_a_file(driver):
    """click on the bucket being used and then upload a file."""


@then('delete the folder from the NAS dataset')
def delete_the_folder_from_the_nas_dataset(driver):
    """Delete the folder from the NAS dataset."""


@then('create a file in the directory of the dataset')
def create_a_file_in_the_directory_of_the_dataset(driver):
    """create a file in the directory of the dataset."""


@then('create a folder, and upload a file in it')
def create_a_folder_and_upload_a_file_in_it(driver):
    """create a folder, and upload a file in it."""


@then('create a sub-folder within the dataset folder and Move the previous file into it')
def create_a_subfolder_within_the_dataset_folder_and_move_the_previous_file_into_it(driver):
    """create a sub-folder within the dataset folder and Move the previous file into it."""


@then('create a sub-folder within the dataset folder create a file into it')
def create_a_subfolder_within_the_dataset_folder_create_a_file_into_it(driver):
    """create a sub-folder within the dataset folder create a file into it."""


@then('delete the file from the S3 bucket in the AWS web console')
def delete_the_file_from_the_s3_bucket_in_the_aws_web_console(driver):
    """delete the file from the S3 bucket in the AWS web console."""


@then('delete the file from the dataset and click Run Now')
def delete_the_file_from_the_dataset_and_click_run_now(driver):
    """delete the file from the dataset and click Run Now."""


@then('delete the folder from the S3 bucket in the AWS web console')
def delete_the_folder_from_the_s3_bucket_in_the_aws_web_console(driver):
    """delete the folder from the S3 bucket in the AWS web console."""


@then('delete the folder from the dataset then click Run Now')
def delete_the_folder_from_the_dataset_then_click_run_now(driver):
    """delete the folder from the dataset then click Run Now."""


@then('expand the new cloud sync task and click Edit')
def expand_the_new_cloud_sync_task_and_click_edit(driver):
    """expand the new cloud sync task and click Edit."""


@then('expand the new task and click Run Now')
def expand_the_new_task_and_click_run_now(driver):
    """expand the new task and click Run Now."""


@then('input a description and select PUSH as the Direction')
def input_a_description_and_select_push_as_the_direction(driver):
    """input a description and select PUSH as the Direction."""


@then('on the NAS tab, expand the new cloud sync task and click Edit')
def on_the_nas_tab_expand_the_new_cloud_sync_task_and_click_edit(driver):
    """on the NAS tab, expand the new cloud sync task and click Edit."""


@then('on the NAS tab, expand the task and click Run Now')
def on_the_nas_tab_expand_the_task_and_click_run_now(driver):
    """on the NAS tab, expand the task and click Run Now."""


@then('on the NAS tab, expand the task on the NAS UI and click Run Now')
def on_the_nas_tab_expand_the_task_on_the_nas_ui_and_click_run_now(driver):
    """on the NAS tab, expand the task on the NAS UI and click Run Now."""


@then('on the NAS tad on the cloud sync task, click Run Now')
def on_the_nas_tad_on_the_cloud_sync_task_click_run_now(driver):
    """on the NAS tad on the cloud sync task, click Run Now."""


@then('on the NAS under the new task, click Run Now')
def on_the_nas_under_the_new_task_click_run_now(driver):
    """on the NAS under the new task, click Run Now."""


@then('on the bucket tab, create a folder, and upload a file in it')
def on_the_bucket_tab_create_a_folder_and_upload_a_file_in_it(driver):
    """on the bucket tab, create a folder, and upload a file in it."""


@then('on the bucket tab, upload a file')
def on_the_bucket_tab_upload_a_file(driver):
    """on the bucket tab, upload a file."""


@then('on the bucket tab, verify the file is deleted')
def on_the_bucket_tab_verify_the_file_is_deleted(driver):
    """on the bucket tab, verify the file is deleted."""


@then('on the bucket tab, verify the folder is deleted')
def on_the_bucket_tab_verify_the_folder_is_deleted(driver):
    """on the bucket tab, verify the folder is deleted."""


@then('on the cloud sync task and click Edit')
def on_the_cloud_sync_task_and_click_edit(driver):
    """on the cloud sync task and click Edit."""


@then('under Transfer Mode, select COPY, then click Save')
def under_transfer_mode_select_copy_then_click_save(driver):
    """under Transfer Mode, select COPY, then click Save."""


@then('under Transfer Mode, select MOVE, click Save')
def under_transfer_mode_select_move_click_save(driver):
    """under Transfer Mode, select MOVE, click Save."""


@then('under Transfer Mode, select MOVE, then click Save')
def under_transfer_mode_select_move_then_click_save(driver):
    """under Transfer Mode, select MOVE, then click Save."""


@then('under Transfer Mode, select SYNC, then click Save')
def under_transfer_mode_select_sync_then_click_save(driver):
    """under Transfer Mode, select SYNC, then click Save."""


@then('under the new task and click Run Now')
def under_the_new_task_and_click_run_now(driver):
    """under the new task and click Run Now."""


@then('verify that the file is deleted on the NAS dataset')
def verify_that_the_file_is_deleted_on_the_nas_dataset(driver):
    """verify that the file is deleted on the NAS dataset."""


@then('verify that the file is not deleted on the NAS')
def verify_that_the_file_is_not_deleted_on_the_nas(driver):
    """verify that the file is not deleted on the NAS."""


@then('verify that the folder is not on the NAS dataset')
def verify_that_the_folder_is_not_on_the_nas_dataset(driver):
    """verify that the folder is not on the NAS dataset."""


@then('verify the file appear in the S3 bucket')
def verify_the_file_appear_in_the_s3_bucket(driver):
    """verify the file appear in the S3 bucket."""


@then('verify the file appear into the S3 bucket and is removed from the NAS')
def verify_the_file_appear_into_the_s3_bucket_and_is_removed_from_the_nas(driver):
    """verify the file appear into the S3 bucket and is removed from the NAS."""


@then('verify the file is copied from the S3 bucket to the dataset')
def verify_the_file_is_copied_from_the_s3_bucket_to_the_dataset(driver):
    """verify the file is copied from the S3 bucket to the dataset."""


@then('verify the file is moved from the S3 bucket to the dataset')
def verify_the_file_is_moved_from_the_s3_bucket_to_the_dataset(driver):
    """verify the file is moved from the S3 bucket to the dataset."""


@then('verify the file is sync from the S3 bucket to the dataset')
def verify_the_file_is_sync_from_the_s3_bucket_to_the_dataset(driver):
    """verify the file is sync from the S3 bucket to the dataset."""


@then('verify the folder and file is copied from the S3 bucket to the dataset')
def verify_the_folder_and_file_is_copied_from_the_s3_bucket_to_the_dataset(driver):
    """verify the folder and file is copied from the S3 bucket to the dataset."""


@then('verify the folder and file is moved from the S3 bucket to the dataset')
def verify_the_folder_and_file_is_moved_from_the_s3_bucket_to_the_dataset(driver):
    """verify the folder and file is moved from the S3 bucket to the dataset."""


@then('verify the folder appear in the S3 bucket with the file')
def verify_the_folder_appear_in_the_s3_bucket_with_the_file(driver):
    """verify the folder appear in the S3 bucket with the file."""
